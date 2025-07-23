"""
Federated learning training script using Flower and TensorFlow.

Usage:
  # Terminal 1 (server)
  python federated_training.py server

  # Terminal 2 .. N (clients)
  python federated_training.py client --cid=<int>

Requires:
  pip install flwr tensorflow

This script keeps your original CNN architecture for Fashion‑MNIST but trains it
with Federated Averaging (FedAvg). Each client gets a partition of the data and
trains locally; the Flower server aggregates the weights round after round.
"""

import argparse
import os
import sys
from typing import Tuple

import numpy as np
import tensorflow as tf
from tensorflow import keras
import flwr as fl

# --------------------------------------------------
# Hyper‑parameters and constants (adjust as needed)
# --------------------------------------------------
NUM_CLIENTS: int = 5         # Total clients expected to connect
ROUNDS: int = 5              # Federated rounds
LOCAL_EPOCHS: int = 1        # SGD epochs per client per round
BATCH_SIZE: int = 32         # SGD batch size
SEED: int = 42               # For reproducibility

np.random.seed(SEED)

# --------------------------------------------------
# Data loading & partitioning helpers
# --------------------------------------------------

def load_partition(cid: int) -> Tuple[Tuple[np.ndarray, np.ndarray], Tuple[np.ndarray, np.ndarray]]:
    """Return the local train/test split for a given client id (cid).

    A simple IID split is performed by shuffling the global training set and
    slicing it into *NUM_CLIENTS* roughly equal parts. All clients share the
    global test set so that evaluation is comparable across rounds.
    """
    (x_train, y_train), (x_test, y_test) = keras.datasets.fashion_mnist.load_data()

    # Pre‑processing identical to your original script
    x_train = x_train.astype("float32") / 255.0
    x_test = x_test.astype("float32") / 255.0
    x_train = x_train.reshape(-1, 28, 28, 1)
    x_test = x_test.reshape(-1, 28, 28, 1)

    # IID partitioning — deterministic per *cid*
    size_per_client = len(x_train) // NUM_CLIENTS
    start, end = cid * size_per_client, (cid + 1) * size_per_client
    x_train_part, y_train_part = x_train[start:end], y_train[start:end]

    return (x_train_part, y_train_part), (x_test, y_test)

# --------------------------------------------------
# Model definition (unchanged from original script)
# --------------------------------------------------

def build_model() -> keras.Model:
    model = keras.Sequential([
        keras.layers.Conv2D(filters=8, kernel_size=3, strides=2, activation="relu", input_shape=(28, 28, 1), name="Conv1"),
        keras.layers.Flatten(),
        keras.layers.Dense(10, activation="softmax", name="Softmax"),
    ])

    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model

# --------------------------------------------------
# Flower client
# --------------------------------------------------

class FashionClient(fl.client.NumPyClient):
    """Flower client implementing the NumPyClient API."""

    def __init__(self, cid: int):
        self.cid = cid
        (self.x_train, self.y_train), (self.x_test, self.y_test) = load_partition(cid)
        self.model = build_model()

    # --- Flower NumPyClient interface ---------------------------
    def get_parameters(self, config):
        return self.model.get_weights()

    def fit(self, parameters, config):
        self.model.set_weights(parameters)
        self.model.fit(
            self.x_train,
            self.y_train,
            epochs=LOCAL_EPOCHS,
            batch_size=BATCH_SIZE,
            verbose=0,
        )
        return self.model.get_weights(), len(self.x_train), {}

    def evaluate(self, parameters, config):
        self.model.set_weights(parameters)
        loss, acc = self.model.evaluate(self.x_test, self.y_test, verbose=0)
        return loss, len(self.x_test), {"accuracy": acc}

# --------------------------------------------------
# Flower server & client start‑up helpers
# --------------------------------------------------

def start_server():
    """Start the central Flower server (aggregator)."""

    strategy = fl.server.strategy.FedAvg(
        fraction_fit=1.0,
        fraction_evaluate=1.0,
        min_fit_clients=NUM_CLIENTS,
        min_available_clients=NUM_CLIENTS,
        min_evaluate_clients=NUM_CLIENTS,
    )

    fl.server.start_server(
        server_address="0.0.0.0:8080",
        config=fl.server.ServerConfig(num_rounds=ROUNDS),
        strategy=strategy,
    )


def start_client(cid: int):
    """Start a client and connect to the Flower server."""
    fl.client.start_numpy_client(
        server_address="0.0.0.0:8080", client=FashionClient(cid)
    )

# --------------------------------------------------
# CLI entry‑point
# --------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Federated Fashion‑MNIST with Flower")
    parser.add_argument("role", choices=["server", "client"], help="Role to run (server or client)")
    parser.add_argument("--cid", type=int, default=0, help="Client identifier (integer)")
    args = parser.parse_args()

    os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"  # Silence TF logging

    if args.role == "server":
        start_server()
    else:
        start_client(args.cid)

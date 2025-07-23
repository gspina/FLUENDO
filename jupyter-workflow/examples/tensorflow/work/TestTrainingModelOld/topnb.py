# This file will be converted to a Jupyter notebook
# We'll create an `.ipynb` file programmatically using nbformat

import nbformat as nbf

# Create a new notebook object
nb = nbf.v4.new_notebook()

# Markdown cell with the script description
desc = """
# Federated Learning Training with Flower and TensorFlow

This notebook implements federated training on the Fashion-MNIST dataset
using Flower (`flwr`) and TensorFlow. Each client trains a simple CNN
a locally and the Flower server aggregates weights using FedAvg.

**Usage**:
- Run the server cell to start the aggregator.
- Launch client cells (in separate processes or terminals) with different `cid` values.

Requirements:
```bash
pip install flwr tensorflow
```
"""
nb['cells'] = [nbf.v4.new_markdown_cell(desc)]

# Cell 1: Imports and hyperparameters
imports = '''
import numpy as np
import tensorflow as tf
from tensorflow import keras
import flwr as fl

# Hyperparameters
NUM_CLIENTS = 5
ROUNDS = 5
LOCAL_EPOCHS = 1
BATCH_SIZE = 32
SEED = 42
np.random.seed(SEED)
'''
nb['cells'].append(nbf.v4.new_code_cell(imports))

# Cell 2: Data loading & partitioning
data_partition = '''
def load_partition(cid: int):
    (x_train, y_train), (x_test, y_test) = keras.datasets.fashion_mnist.load_data()
    x_train = x_train.astype("float32") / 255.0
    x_test = x_test.astype("float32") / 255.0
    x_train = x_train.reshape(-1, 28, 28, 1)
    x_test = x_test.reshape(-1, 28, 28, 1)

    size_per_client = len(x_train) // NUM_CLIENTS
    start, end = cid * size_per_client, (cid + 1) * size_per_client
    return (x_train[start:end], y_train[start:end]), (x_test, y_test)
'''
nb['cells'].append(nbf.v4.new_code_cell(data_partition))

# Cell 3: Model building
def_model = '''
def build_model():
    model = keras.Sequential([
        keras.layers.Conv2D(8, 3, strides=2, activation="relu", input_shape=(28, 28, 1)),
        keras.layers.Flatten(),
        keras.layers.Dense(10, activation="softmax"),
    ])
    model.compile(optimizer="adam",
                  loss="sparse_categorical_crossentropy",
                  metrics=["accuracy"])
    return model
'''
nb['cells'].append(nbf.v4.new_code_cell(def_model))

# Cell 4: Flower client class
flower_client = '''
class FashionClient(fl.client.NumPyClient):
    def __init__(self, cid):
        self.cid = cid
        (self.x_train, self.y_train), (self.x_test, self.y_test) = load_partition(cid)
        self.model = build_model()

    def get_parameters(self, config):
        return self.model.get_weights()

    def fit(self, parameters, config):
        self.model.set_weights(parameters)
        self.model.fit(self.x_train, self.y_train,
                       epochs=LOCAL_EPOCHS,
                       batch_size=BATCH_SIZE,
                       verbose=0)
        return self.model.get_weights(), len(self.x_train), {}

    def evaluate(self, parameters, config):
        self.model.set_weights(parameters)
        loss, acc = self.model.evaluate(self.x_test, self.y_test, verbose=0)
        return loss, len(self.x_test), {"accuracy": acc}
'''
nb['cells'].append(nbf.v4.new_code_cell(flower_client))

# Cell 5: Server and client launcher functions
launcher = '''
def start_server():
    strategy = fl.server.strategy.FedAvg(
        fraction_fit=1.0,
        fraction_evaluate=1.0,
        min_fit_clients=NUM_CLIENTS,
        min_available_clients=NUM_CLIENTS,
        min_evaluate_clients=NUM_CLIENTS,
    )
    fl.server.start_server(server_address="0.0.0.0:8080",
                           config=fl.server.ServerConfig(num_rounds=ROUNDS),
                           strategy=strategy)


def start_client(cid):
    fl.client.start_numpy_client(server_address="0.0.0.0:8080",
                                 client=FashionClient(cid))

# To start, uncomment the desired cell below:
# start_server()
# start_client(cid=0)
'''
nb['cells'].append(nbf.v4.new_code_cell(launcher))

# Write the notebook to file
with open('./federated_training.ipynb', 'w') as f:
    nbf.write(nb, f)

print("Notebook saved to ./federated_training.ipynb")

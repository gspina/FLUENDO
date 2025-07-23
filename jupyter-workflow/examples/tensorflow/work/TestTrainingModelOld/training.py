import sys

# Confirm that we're using Python 3
assert sys.version_info.major == 3, 'Oops, not running Python 3. Use Runtime > Change runtime type'

# TensorFlow and tf.keras
import tensorflow as tf
from tensorflow import keras

# Helper libraries
import numpy as np
import matplotlib.pyplot as plt
import os
import subprocess

print('TensorFlow version: {}'.format(tf.__version__))
# TensorFlow and tf.keras
import tensorflow as tf
from tensorflow import keras


fashion_mnist = keras.datasets.fashion_mnist
(train_images, train_labels), (test_images, test_labels) = fashion_mnist.load_data()

# scale the values to 0.0 to 1.0
train_images = train_images / 255.0
test_images = test_images / 255.0

# reshape for feeding into the model
train_images = train_images.reshape(train_images.shape[0], 28, 28, 1)
test_images = test_images.reshape(test_images.shape[0], 28, 28, 1)

class_names = ['T-shirt/top', 'Trouser', 'Pullover', 'Dress', 'Coat',
               'Sandal', 'Shirt', 'Sneaker', 'Bag', 'Ankle boot']

print('\ntrain_images.shape: {}, of {}'.format(train_images.shape, train_images.dtype))
print('test_images.shape: {}, of {}'.format(test_images.shape, test_images.dtype))

import tensorflow as tf
from tensorflow import keras


model = keras.Sequential([
  keras.layers.Conv2D(input_shape=(28,28,1), filters=8, kernel_size=3, 
                      strides=2, activation='relu', name='Conv1'),
  keras.layers.Flatten(),
  keras.layers.Dense(10, activation=tf.nn.softmax, name='Softmax')
])
model.summary()

import tensorflow as tf
from tensorflow import keras


testing = False
epochs = 20

strategy = tf.distribute.MirroredStrategy()

with strategy.scope():
    model = tf.keras.models.clone_model(model)
    model.compile(optimizer='adam', 
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
    model.fit(train_images, train_labels, epochs=epochs)
    test_loss, test_acc = model.evaluate(test_images, test_labels)
    
print('\nTest accuracy: {}'.format(test_acc))

import tempfile
import tensorflow as tf
from tensorflow import keras
import os

export_path = tempfile.mktemp(suffix='.keras')
print(f'Saving model to {export_path}…')

model.save(export_path)

print('\nSaved model:')
info = os.stat(export_path)
print(f'- Dimensione: {info.st_size} byte')
print(f'- Permessi: {oct(info.st_mode)}')
print(f'- Ultima modifica: {os.path.getmtime(export_path)}')
import os
import shutil

src = export_path

dest_parent = "/models/model"

if os.path.exists(dest_parent):
    shutil.rmtree(dest_parent)

os.makedirs(dest_parent, exist_ok=True)

dest = os.path.join(dest_parent, "1")
if os.path.isdir(src):
    shutil.copytree(src, dest)
else:
    shutil.copy2(src, dest)

print(f"Modello copiato in {dest}")
import numpy as np
from tensorflow import keras


model = keras.models.load_model(export_path)



batch = test_images[0:3]  # shape: (3, altezza, larghezza, canali)

predictions = model.predict(batch)

print("Predictions shape:", predictions.shape)
print(predictions)

import numpy as np
import matplotlib.pyplot as plt

def show(idx, title):
    plt.figure()
    plt.imshow(test_images[idx].reshape(28,28))
    plt.axis('off')
    plt.title('\n\n{}'.format(title), fontdict={'size': 16})

for index in range(3):
    show(index, 'The model thought this was a {} (class {}), and it was actually a {} (class {})'.format(
      class_names[np.argmax(predictions[index])], np.argmax(predictions[index]), class_names[test_labels[index]], test_labels[index]))


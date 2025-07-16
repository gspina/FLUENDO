import collections

import numpy as np
import tensorflow as tf
import tensorflow_federated as tff
np.random.seed(0)
from tensorflow.python.client import device_lib
print(device_lib.list_local_devices()) # list of DeviceAttributes

is_cuda_gpu_available = tf.test.is_gpu_available(cuda_only=True)

print(tf.config.list_physical_devices('GPU'))
print(is_cuda_gpu_available)
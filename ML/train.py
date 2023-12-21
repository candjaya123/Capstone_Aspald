import matplotlib.pyplot as plt
import numpy as np
import os
import seaborn as sns
import tensorflow as tf
from keras import models
from keras.utils import to_categorical, plot_model
from keras.layers import Conv2D, Dense, Dropout, MaxPooling2D, BatchNormalization, GlobalAveragePooling2D, Input, Activation
from keras.models import Sequential, load_model
from keras.callbacks import EarlyStopping, Callback , ModelCheckpoint, ReduceLROnPlateau
from keras.preprocessing.image import ImageDataGenerator
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, classification_report
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# initial parameters
epochs = 100
batch_size = 32
input_size = (224,224)
model = Sequential([
    Input(shape=(*input_size, 3)),
    Conv2D(32, kernel_size=(3, 3), strides=(1, 1), padding='same'),
    BatchNormalization(),
    Activation('relu'),
    MaxPooling2D(pool_size=(2, 2), strides=(2, 2)),
    Dropout(0.25),

    Conv2D(64, kernel_size=(3, 3), strides=(1, 1), padding='same'),
    BatchNormalization(),
    Activation('relu'),

    Conv2D(64, kernel_size=(3, 3), strides=(1, 1), padding='same'),
    BatchNormalization(),
    Activation('relu'),
    MaxPooling2D(pool_size=(2, 2), strides=(2, 2)),
    Dropout(0.25),

    Conv2D(128, kernel_size=(3, 3), strides=(1, 1), padding='same'),
    BatchNormalization(),
    Activation('relu'),

    Conv2D(128, kernel_size=(3, 3), strides=(1, 1), padding='same'),
    BatchNormalization(),
    Activation('relu'),
    MaxPooling2D(pool_size=(2, 2), strides=(2, 2)),
    Dropout(0.25),

    GlobalAveragePooling2D(),

    Dense(256, activation='relu'),
    BatchNormalization(),
    Dropout(0.5),

    Dense(128, activation='relu'),
    BatchNormalization(),
    Dropout(0.5),

    Dense(6, activation='softmax')
])

model.summary()
batch_sizes=32

TRAINING_DIR = "dataset/train"
training_datagen = ImageDataGenerator(
      rescale = 1./255,
	    rotation_range=40,
      width_shift_range=0.2,
      height_shift_range=0.2,
      shear_range=0.2,
      zoom_range=0.2,
      horizontal_flip=True,
      fill_mode='nearest')

VALIDATION_DIR = "dataset/valid"
validation_datagen = ImageDataGenerator(rescale = 1./255)

train_generator = training_datagen.flow_from_directory(
	TRAINING_DIR,
	target_size=(150,150),
	class_mode='categorical',
  batch_size=batch_sizes
)

TEST_DIR = "dataset/test"
test_generator = training_datagen.flow_from_directory(
	TEST_DIR,
	target_size=(150,150),
	class_mode='categorical',
  batch_size=batch_sizes
)

validation_generator = validation_datagen.flow_from_directory(
	VALIDATION_DIR,
	target_size=(150,150),
	class_mode='categorical',
  batch_size=batch_sizes
)

STEP_SIZE_TRAIN=train_generator.n//train_generator.batch_size
STEP_SIZE_VALID=validation_generator.n//validation_generator.batch_size

#Optimizer Adam
opt = tf.keras.optimizers.Adam(learning_rate=0.001)

#Compiling the model
model.compile(optimizer=opt, loss='categorical_crossentropy', metrics=['accuracy'])
early_stop = EarlyStopping(monitor='val_loss', patience=100, restore_best_weights=True)
checkpoint = ModelCheckpoint("model/jalan_rusak_model.h5", verbose=1, save_best_only=True)

# fit the cnn model to the trainig set and testing it on the test set
hist = model.fit_generator(
          train_generator,
          steps_per_epoch=STEP_SIZE_TRAIN,
          epochs = epochs,
          callbacks=[early_stop, checkpoint],
          validation_data=validation_generator,
          validation_steps=STEP_SIZE_VALID)

model = models.load_model('model/jalan_rusak_model.h5')
score_val = model.evaluate_generator(validation_generator, steps=STEP_SIZE_VALID)
print('val loss:', score_val[0])
print('val accuracy:', score_val[1])
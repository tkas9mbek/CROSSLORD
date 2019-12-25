import * as tf from "@tensorflow/tfjs";

const tranClues = require("./data/clues.json");

const MODEL_NAME = "clue-ranker-model-v32";
const N_CLASSES = 2;

const encodeData = async (encoder, clues) => {
  const sentences = clues.map(t => t.clue.toLowerCase());
  return await encoder.embed(sentences);
};

const trainModel = async encoder => {
  try {
    const loadedModel = await tf.loadLayersModel(
      `localstorage://${MODEL_NAME}`
    );
    console.log("Using existing model");
    return loadedModel;
  } catch (e) {
    console.log("Training new model");
  }

  const xTrain = await encodeData(encoder, tranClues);

  const yTrain = tf.tensor2d(
    tranClues.map(t => [t.rank === "OK" ? 1 : 0, t.rank === "BAD" ? 1 : 0])
  );

  const model = tf.sequential();

  model.add(
    tf.layers.dense({
      inputShape: [xTrain.shape[1]],
      activation: "softmax",
      units: N_CLASSES
    })
  );

  model.compile({
    loss: "categoricalCrossentropy",
    optimizer: tf.train.adam(0.001),
    metrics: ["accuracy"]
  });

  await model.fit(xTrain, yTrain, {
    batchSize: 32,
    validationSplit: 0.1,
    shuffle: true,
    epochs: 175
  });

  await model.save(`localstorage://${MODEL_NAME}`);

  return model;
};

const getOKChance = async (model, encoder, newClue) => {
  const xPredict = await encodeData(encoder, [{ clue: newClue.toLowerCase() }]);
  const prediction = await model.predict(xPredict).data();
  return parseInt(prediction[0] * 100);
};

export { getOKChance, trainModel };

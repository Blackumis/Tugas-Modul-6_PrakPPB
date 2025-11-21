import mqtt from "mqtt";

const BROKER_URL = "mqtt://broker.hivemq.com:1883";
const TEMP_TOPIC = "ppb/kel39/iot/temperature";
const HUMIDITY_TOPIC = "ppb/kel39/iot/humidity";
const BACKEND_BASE_URL = "http://localhost:5000";
const PUBLISH_INTERVAL_MS = 5000;

const clientId = `simulator-${Math.random().toString(16).slice(2)}`;
const client = mqtt.connect(BROKER_URL, {
  clientId,
  clean: true,
  reconnectPeriod: 5000,
});

client.on("connect", () => {
  console.log(`MQTT connected as ${clientId}`);
});

client.on("reconnect", () => {
  console.log("Reconnecting to MQTT broker...");
});

client.on("error", (error) => {
  console.error("MQTT error", error.message);
});

async function fetchLatestThresholds() {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/thresholds/latest`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return {
      temperature: data?.temperature_value ?? null,
      humidity: data?.humidity_value ?? null
    };
  } catch (error) {
    console.error("Failed to fetch thresholds:", error.message);
    return { temperature: null, humidity: null };
  }
}

async function publishLoop() {
  let thresholds = await fetchLatestThresholds();

  setInterval(async () => {
    const temperature = Number((Math.random() * 15 + 20).toFixed(2));
    const humidity = Number((Math.random() * 30 + 40).toFixed(2)); // Random humidity between 40-70%
    const timestamp = new Date().toISOString();

    const tempPayload = JSON.stringify({ temperature, timestamp });
    const humidityPayload = JSON.stringify({ humidity, timestamp });

    client.publish(TEMP_TOPIC, tempPayload, { qos: 0 }, (error) => {
      if (error) {
        console.error("Failed to publish temperature", error.message);
      } else {
        console.log(`Published temperature: ${tempPayload} to ${TEMP_TOPIC}`);
      }
    });

    client.publish(HUMIDITY_TOPIC, humidityPayload, { qos: 0 }, (error) => {
      if (error) {
        console.error("Failed to publish humidity", error.message);
      } else {
        console.log(`Published humidity: ${humidityPayload} to ${HUMIDITY_TOPIC}`);
      }
    });

    if (thresholds.temperature === null || thresholds.humidity === null || Math.random() < 0.2) {
      thresholds = await fetchLatestThresholds();
    }

    // Check temperature threshold
    // Check if either threshold is exceeded
    if ((typeof thresholds.temperature === "number" && temperature >= thresholds.temperature) ||
        (typeof thresholds.humidity === "number" && humidity >= thresholds.humidity)) {
      try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/readings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            temperature,
            humidity,
            threshold_value: temperature >= thresholds.temperature ? thresholds.temperature : thresholds.humidity,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }

        if (temperature >= thresholds.temperature) {
          console.log(
            `Saved triggered temperature reading ${temperature}°C (threshold ${thresholds.temperature}°C)`
          );
        }
        if (humidity >= thresholds.humidity) {
          console.log(
            `Saved triggered humidity reading ${humidity}% (threshold ${thresholds.humidity}%)`
          );
        }
      } catch (error) {
        console.error("Failed to save triggered reading:", error.message);
      }
    }

    // Check humidity threshold
    if (typeof thresholds.humidity === "number" && humidity >= thresholds.humidity) {
      try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/readings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            temperature,
            humidity,
            threshold_value: thresholds.humidity,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }

        console.log(
          `Saved triggered humidity reading ${humidity}% (threshold ${thresholds.humidity}%)`
        );
      } catch (error) {
        console.error("Failed to save triggered reading:", error.message);
      }
    }
  }, PUBLISH_INTERVAL_MS);
}

publishLoop().catch((error) => {
  console.error("Simulator failed to start:", error.message);
  process.exit(1);
});

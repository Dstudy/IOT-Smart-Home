#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <DHT.h>
#include <BH1750.h>

/* ================= WIFI ================= */
const char* ssid = "101";
const char* password = "12345687";

/* ================= MQTT ================= */
const char* mqtt_server = "10.127.57.66";
const int mqtt_port = 1880;
const char* mqtt_user = "Duong";
const char* mqtt_pass = "12345678";

const char* topic_data = "iot/datasensors";
const char* topic_control = "iot/devicecontrol";
const char* topic_response = "iot/dataresponse";


/* ================= SENSOR PIN ================= */
#define SDA_PIN 21
#define SCL_PIN 22
BH1750 lightMeter;

/* ================= SENSOR PIN ================= */
#define DHTPIN 4
#define DHTTYPE DHT11

/* ================= DEVICE PIN ================= */
#define LED_TEMP 27
#define LED_HUM 5
#define LED_LDR 26


/* ================= SENSOR ================= */
DHT dht(DHTPIN, DHTTYPE);

float temp;
float hum;
// int gasState;
int lightValue;

/* ================= MQTT ================= */
WiFiClient espClient;
PubSubClient client(espClient);

/* ================= BLINK ================= */
void blinkAllDevices(int times) {

  for (int i = 0; i < times; i++) {

    digitalWrite(LED_TEMP, HIGH);
    delay(300);
    digitalWrite(LED_TEMP, LOW);

    digitalWrite(LED_HUM, HIGH);
    delay(300);
    digitalWrite(LED_HUM, LOW);

    digitalWrite(LED_LDR, HIGH);
    delay(300);
    digitalWrite(LED_LDR, LOW);

  }
}

/* ================= WIFI ================= */
void setup_wifi() {

  Serial.print("Connecting WiFi ");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

/* ================= MQTT RECONNECT ================= */
void reconnect() {

  while (!client.connected()) {

    if (client.connect("MQTT", mqtt_user, mqtt_pass)) {

      Serial.println("connected");
      client.subscribe(topic_control);

    } else {

      Serial.print("failed, rc=");
      Serial.println(client.state());
      delay(2000);
    }

    if (client.connect("ESP32_CLIENT", mqtt_user, mqtt_pass)) {

      Serial.println("connected");

      client.subscribe(topic_control);

      Serial.println("Subscribed topic control");
    }

    else {

      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 2 seconds");

      delay(2000);
    }
  }
}

/* ================= RESPONSE ================= */
void sendResponse(String device, String action, String status) {

  StaticJsonDocument<128> doc;

  doc["device"] = device;
  doc["action"] = action;
  doc["status"] = status;

  char buffer[128];
  serializeJson(doc, buffer);

  client.publish(topic_response, buffer);

  Serial.print("Response (JSON): ");
  Serial.println(buffer);
}

/* ================= MQTT CALLBACK ================= */
void callback(char* topic, byte* payload, unsigned int length) {

  String message = "";

  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  message.trim();

  Serial.print("[MQTT CONTROL] ");
  Serial.println(message);

  if (message == "OnFan") {
    digitalWrite(LED_TEMP, HIGH);
    sendResponse("Fan", "ON", "success");
  }

  else if (message == "OffFan") {
    digitalWrite(LED_TEMP, LOW);
    sendResponse("Fan", "OFF", "success");
  }

  else if (message == "OnAC") {
    digitalWrite(LED_HUM, HIGH);
    sendResponse("Ac", "ON", "success");
  }

  else if (message == "OffAC") {
    digitalWrite(LED_HUM, LOW);
    sendResponse("Ac", "OFF", "success");
  }

  else if (message == "OnLight") {
    digitalWrite(LED_LDR, HIGH);
    sendResponse("Light", "ON", "success");
  }

  else if (message == "OffLight") {
    digitalWrite(LED_LDR, LOW);
    sendResponse("Light", "OFF", "success");
  }

  else if (message == "OnAll") {

    digitalWrite(LED_TEMP, HIGH);
    digitalWrite(LED_HUM, HIGH);
    digitalWrite(LED_LDR, HIGH);

    sendResponse("AllDevices", "ON", "success");
  }

  else if (message == "OffAll") {

    digitalWrite(LED_TEMP, LOW);
    digitalWrite(LED_HUM, LOW);
    digitalWrite(LED_LDR, LOW);

    sendResponse("AllDevices", "OFF", "success");
  }

  else if (message == "BlinkAll") {

    blinkAllDevices(10);

    sendResponse("AllDevices", "BLINK", "success");
  }
}

/* ================= SETUP ================= */
void setup() {

  Serial.begin(115200);

  Wire.begin(SDA_PIN, SCL_PIN);

  dht.begin();

  lightMeter.begin();

  pinMode(LED_TEMP, OUTPUT);
  pinMode(LED_HUM, OUTPUT);
  pinMode(LED_LDR, OUTPUT);

  analogSetAttenuation(ADC_11db);

  setup_wifi();

  client.setServer(mqtt_server, mqtt_port);

  client.setCallback(callback);
}

/* ================= LOOP ================= */
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  hum = dht.readHumidity();
  temp = dht.readTemperature();
  lightValue = lightMeter.readLightLevel();;

  if (isnan(temp) || isnan(hum)) {
    Serial.println("Cannot read from DHT11");
    return;
  }

  // Tạo đối tượng JSON
  StaticJsonDocument<256> doc;
  doc["temp"] = temp;
  doc["hum"] = hum;
  doc["lightValue"] = lightValue;

  char buffer[256];
  serializeJson(doc, buffer);

  client.publish(topic_data, buffer);

  Serial.println("Published JSON:");
  Serial.println(buffer);
  Serial.println("----------------------");

  delay(2000);
}
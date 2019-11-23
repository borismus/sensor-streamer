#include <Wire.h>
#include "Nunchuk.h"
#include <WebUSB.h>

/**
   Creating an instance of WebUSBSerial will add an additional USB interface to
   the device that is marked as vendor-specific (rather than USB CDC-ACM) and
   is therefore accessible to the browser.

   The URL here provides a hint to the browser about what page the user should
   navigate to to interact with the device.
*/
WebUSB WebUSBSerial(1, "borismus.github.io/sensor-streamer/nunchuck-webusb");

#define Serial WebUSBSerial

void setup() {
  while (!Serial);
  Serial.begin(9600);
  Wire.begin();

  // Change TWI speed for nuchuk, which uses Fast-TWI (400kHz)
  Wire.setClock(400000);

  Serial.println("nunchuk_init");
  nunchuk_init();
}

void loop() {
  if (nunchuk_read()) {
    print_all();
  }
}

/**
 * A verbatim re-implementation of nunchuk_print, this time using the newly redefined
 * Serial interface so that these events are sent through WebUSB.
*/
void print_all() {
  Serial.print(millis(), DEC);
  Serial.print(",");
  Serial.print(nunchuk_joystickX(), DEC);
  Serial.print(",");
  Serial.print(nunchuk_joystickY(), DEC);
  Serial.print(",");
  Serial.print(nunchuk_accelX(), DEC);
  Serial.print(",");
  Serial.print(nunchuk_accelY(), DEC);
  Serial.print(",");
  Serial.print(nunchuk_accelZ(), DEC);
  Serial.print(",");
  Serial.print(nunchuk_buttonZ(), DEC);
  Serial.print(",");
  Serial.print(nunchuk_buttonC(), DEC);
  Serial.print("\n");
}

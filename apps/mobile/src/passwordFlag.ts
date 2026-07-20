import AsyncStorage from "@react-native-async-storage/async-storage";

// Remembers on this device that the user set a password, so the sign-in
// screen knows whether to surface the password login. A returning user on a
// fresh device just falls back to OTP/Google — no lockout.
const KEY = "waft.hasPassword";

export async function markHasPassword() {
  await AsyncStorage.setItem(KEY, "1");
}

export async function getHasPassword(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === "1";
}

import { useState } from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { TextInput } from "@/components/ui/text-input";
import { useAuth } from "@/context/auth-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Username and password are required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await login(username, password);

    setIsSubmitting(false);

    if (result.success) {
      router.replace("/(tabs)");
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <View className="flex-1 bg-page dark:bg-page-dark">
      {/* Hero Section — 50% screen height */}
      <View
        style={{ height: SCREEN_HEIGHT * 0.5 }}
        className="items-center justify-center overflow-hidden bg-primary"
      >
        {/* Decorative bubbles */}
        <View
          style={{
            position: "absolute",
            top: -40,
            left: -40,
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: "rgba(255,255,255,0.08)",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 20,
            right: -30,
            width: 110,
            height: 110,
            borderRadius: 55,
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -30,
            left: 30,
            width: 90,
            height: 90,
            borderRadius: 45,
            backgroundColor: "rgba(255,255,255,0.07)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: "40%",
            left: -20,
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: "rgba(255,255,255,0.05)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 60,
            right: -20,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        />

        {/* Logo */}
        <Image
          source={require("@/assets/images/quinns_logo_white.png")}
          style={{ width: 100, height: 100 }}
          resizeMode="contain"
        />
        <Text
          style={{
            fontFamily: "Ceoruse",
            fontSize: 38,
            color: "white",
            marginTop: 16,
          }}
        >
          QUINNS
        </Text>
        <Text
          style={{
            fontFamily: "HelveticaRoundedBold",
            fontSize: 13,
            letterSpacing: 3,
            color: "#d8b4fe",
            marginTop: 4,
          }}
        >
          LAUNDRY MANAGEMENT
        </Text>
        <Text
          style={{ fontFamily: "HelveticaRoundedBold" }}
          className="mt-1 text-md font-medium tracking-widest text-primary-200"
        >
          DASHBOARD
        </Text>
      </View>

      {/* Form Section */}
      <View className="flex-1 px-8 pt-8">
        <View className="gap-4">
          <TextInput
            label="Username"
            placeholder="Enter username"
            value={username}
            onChangeText={setUsername}
            editable={!isSubmitting}
          />

          <TextInput
            label="Password"
            placeholder="Enter password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            editable={!isSubmitting}
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#71717a"
                />
              </TouchableOpacity>
            }
          />

          {errorMessage ? (
            <Text className="text-sm text-red-500 dark:text-red-400">
              {errorMessage}
            </Text>
          ) : null}

          <TouchableOpacity
            className={`mt-2 w-full items-center rounded-lg bg-primary py-3.5${isSubmitting ? " opacity-50" : ""}`}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            <Text className="text-sm font-semibold text-white">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

import { Component } from "react";
import { Button, Text, View } from "react-native";

class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Text style={{ fontSize: 18, color: "#FF4C4C", textAlign: "center" }}>
            Something went wrong. Please try again or contact support.
          </Text>
          {this.state.error && (
            <Text style={{ color: "#555", marginTop: 10 }}>
              Error: {this.state.error.toString()}
            </Text>
          )}
          <Button title="Retry" onPress={this.resetError} color="#00BFA6" />
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
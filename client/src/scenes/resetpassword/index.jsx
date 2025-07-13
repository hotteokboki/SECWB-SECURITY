import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  TextField,
  Alert,
  Snackbar,
  useTheme,
  LinearProgress,
} from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const PasswordReset = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
    color: "#f44336",
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  });

  // Password strength calculation
  // Requirements:
  // - At least 8 characters long
  // - At least one uppercase letter (A-Z)
  // - At least one lowercase letter (a-z)
  // - At least one number (0-9)
  // - At least one special character (!@#$%^&*(),.?":{}|<>)
  const calculatePasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;

    let feedback = "";
    let color = "#f44336"; // Red

    if (score === 0) {
      feedback = "";
      color = "#f44336";
    } else if (score === 1) {
      feedback = "Very Weak";
      color = "#f44336";
    } else if (score === 2) {
      feedback = "Weak";
      color = "#ff9800";
    } else if (score === 3) {
      feedback = "Fair";
      color = "#ffeb3b";
    } else if (score === 4) {
      feedback = "Good";
      color = "#4caf50";
    } else if (score === 5) {
      feedback = "Strong";
      color = "#2e7d32";
    }

    return { score, feedback, color, requirements };
  };

  // Update password strength when password changes
  useEffect(() => {
    if (password) {
      setPasswordStrength(calculatePasswordStrength(password));
    } else {
      setPasswordStrength({
        score: 0,
        feedback: "",
        color: "#f44336",
        requirements: {
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false,
        },
      });
    }
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setMessage("");
      setSnackbarOpen(true);
      return;
    }

    // Check password strength - require at least "Fair" (score 3)
    if (passwordStrength.score < 3) {
      setError("Password is too weak. Please create a stronger password.");
      setMessage("");
      setSnackbarOpen(true);
      return;
    }

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/auth/reset-password`,
        {
          token,
          newPassword: password,
        }
      );
      setMessage(res.data.message);
      setError("");
      setSnackbarOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      setMessage("");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const getPasswordRequirements = () => {
    const { requirements } = passwordStrength;
    const reqList = [
      {
        key: "length",
        text: "At least 8 characters",
        met: requirements.length,
      },
      {
        key: "uppercase",
        text: "One uppercase letter",
        met: requirements.uppercase,
      },
      {
        key: "lowercase",
        text: "One lowercase letter",
        met: requirements.lowercase,
      },
      { key: "number", text: "One number", met: requirements.number },
      {
        key: "special",
        text: "One special character",
        met: requirements.special,
      },
    ];

    return reqList.map((req) => (
      <Typography
        key={req.key}
        variant="caption"
        sx={{
          color: req.met ? "#4caf50" : "#666",
          fontSize: "0.75rem",
          display: "block",
        }}
      >
        {req.met ? "✓" : "○"} {req.text}
      </Typography>
    ));
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Reset Password" subtitle="Choose a new password" />
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={4}
        mt={4}
      >
        <Box
          width="50%"
          bgcolor="white"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          padding={4}
          gap={2}
        >
          <Box bgcolor="#1E4D2B" p={2} width="100%" textAlign="center">
            <Typography variant="h6" color="#fff" fontWeight="bold">
              Please enter your new password below
            </Typography>
          </Box>

          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <TextField
              type="password"
              label="New Password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{ style: { color: "#000" } }}
              InputLabelProps={{ style: { color: "#000" } }}
              sx={{
                mb: 1,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#000" },
                  "&:hover fieldset": { borderColor: "#000" },
                  "&.Mui-focused fieldset": { borderColor: "#000" },
                },
              }}
            />

            {/* Password Strength Indicator */}
            {password && (
              <Box sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="caption" sx={{ color: "#666" }}>
                    Password strength:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: passwordStrength.color,
                      fontWeight: "bold",
                    }}
                  >
                    {passwordStrength.feedback}
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={(passwordStrength.score / 5) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#e0e0e0",
                    mb: 1,
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: passwordStrength.color,
                      borderRadius: 3,
                    },
                  }}
                />

                <Box sx={{ mt: 1 }}>{getPasswordRequirements()}</Box>
              </Box>
            )}

            <TextField
              type="password"
              label="Confirm New Password"
              fullWidth
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{ style: { color: "#000" } }}
              InputLabelProps={{ style: { color: "#000" } }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#000" },
                  "&:hover fieldset": { borderColor: "#000" },
                  "&.Mui-focused fieldset": { borderColor: "#000" },
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={
                passwordStrength.score < 3 || password !== confirmPassword
              }
              sx={{
                backgroundColor: "#1E4D2B",
                color: "#fff",
                fontWeight: "bold",
                "&:hover": { backgroundColor: "#145A32" },
                "&:disabled": {
                  backgroundColor: "#ccc",
                  color: "#666",
                },
              }}
            >
              Reset Password
            </Button>
          </form>

          <Typography mt={2}>
            <Link
              to="/"
              style={{ color: "#1E4D2B", textDecoration: "underline" }}
            >
              Go back to Home
            </Link>
          </Typography>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        {message ? (
          <Alert
            severity="success"
            onClose={handleCloseSnackbar}
            sx={{ width: "100%" }}
          >
            {message}
          </Alert>
        ) : error ? (
          <Alert
            severity="error"
            onClose={handleCloseSnackbar}
            sx={{ width: "100%" }}
          >
            {error}
          </Alert>
        ) : null}
      </Snackbar>
    </Box>
  );
};

export default PasswordReset;

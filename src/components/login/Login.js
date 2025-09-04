import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const credentials = {
      username: username,
      password: password,
    };

    await login(credentials);
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  return (
    <div>
      <div className="login-errormsg">{error}</div>
      <div className="login">
        <form onSubmit={handleSubmit}>
          <div className="login-header">
            <h2>Log in to Halt Portal</h2>
          </div>

          <div className="login-body">
            <div className="login-debug">
              <div>
                <label className="login-input-header">User ID:</label>
                <input
                  className="login-input"
                  value={username}
                  placeholder="Username"
                  onChange={handleUsernameChange}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="login-input-header">Password:</label>
                <input
                  className="login-input"
                  value={password}
                  type="password"
                  placeholder="Password"
                  onChange={handlePasswordChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <input
                className="login-submit"
                type="submit"
                value={loading ? "Loading..." : "Login"}
                disabled={loading}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

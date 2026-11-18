// src/pages/user/profile/index.js
import { Navigate } from "react-router-dom";

export default function ProfileIndex() {
  // "/user/profile" гэж ороход автоматаар "/user/profile/info" руу чиглүүлнэ
  return <Navigate to="/user/profile/info" replace />;
}

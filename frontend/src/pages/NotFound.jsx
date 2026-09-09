import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="not-found">
    <h1>404</h1>
    <p>This page doesn't exist.</p>
    <Link to="/">Go back home</Link>
  </div>
);

export default NotFound;

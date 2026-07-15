import usePermission from "../../hooks/usePermission";

/**
 * Renders children only when the current user has the required permission(s).
 * @param {string | string[]} action - Single action or array of actions (ANY logic).
 * @param {React.ReactNode} children - Content to show when permitted.
 * @param {React.ReactNode} [fallback=null] - Content to show when not permitted.
 */
const CanDo = ({ action, children, fallback = null }) => {
  const allowed = usePermission(action);
  return allowed ? children : fallback;
};

export default CanDo;

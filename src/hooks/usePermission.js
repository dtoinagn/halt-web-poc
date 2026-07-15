import { useContext } from "react";
import { LoggedInUserContext } from "../contexts/LoggedInUserContext";

/**
 * Returns true if the current user has the given permission(s).
 * @param {string | string[]} action - A single action string or an array of action strings.
 *   When an array is passed, returns true if the user has ANY of them (OR logic).
 */
const usePermission = (action) => {
  const context = useContext(LoggedInUserContext);
  const permissions = context?.permissions ?? null;

  // null means the server didn't send an actions list — no restrictions apply.
  if (permissions === null) return true;

  if (Array.isArray(action)) {
    return action.some((a) => permissions.includes(a));
  }
  return permissions.includes(action);
};

export default usePermission;

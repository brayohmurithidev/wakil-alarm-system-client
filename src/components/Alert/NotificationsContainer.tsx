import "react-toastify/dist/ReactToastify.css";

import { X } from "lucide-react";
import { ToastContainer } from "react-toastify";

import styles from "./index.module.css";

const NotificationsContainer = () => (
  <ToastContainer
    className={styles.notificationsContainer}
    position="top-right"
    autoClose={6000}
    hideProgressBar
    newestOnTop={false}
    closeOnClick
    rtl={false}
    draggable
    pauseOnHover
    closeButton={<X className="h-5 w-5" />}
  />
);

export { NotificationsContainer };

"use client";
import { AlertToastContainer } from "@/components/alert-toasts";
import { useAlerts } from "@/components/alert-toasts";
export function AlertProvider() {
  const { alerts, dismissAlert } = useAlerts();
  return <AlertToastContainer alerts={alerts} onDismiss={dismissAlert} />;
}

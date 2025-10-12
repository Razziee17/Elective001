// context/AppointmentContext.js
import { createContext, useContext, useState } from "react";

const AppointmentContext = createContext();

export const AppointmentProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);

  const addAppointment = (appointment) => {
    setAppointments((prev) => [...prev, { ...appointment, status: "pending" }]);
  };

  const updateAppointmentStatus = (id, newStatus) => {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === id ? { ...appt, status: newStatus } : appt
      )
    );
  };

  const completedAppointments = appointments.filter(
    (appt) => appt.status === "completed"
  );

  const approvedAppointments = appointments.filter(
    (appt) => appt.status === "approved"
  );

  const pendingAppointments = appointments.filter(
    (appt) => appt.status === "pending"
  );

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        addAppointment,
        updateAppointmentStatus,
        completedAppointments,
        approvedAppointments,
        pendingAppointments,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointments = () => useContext(AppointmentContext);

        import React, { useEffect, useState } from "react";

        const UpdatePopup = () => { // Ab props se customerId lene ki zaroorat nahi
          const customerId = process.env.REACT_APP_OTA_CUSTOMER_ID; // Environment variable se ID lein
          const [showPopup, setShowPopup] = useState(false);
          const [updateType, setUpdateType] = useState(null);
          const [loading, setLoading] = useState(false);
          const [message, setMessage] = useState("");

          useEffect(() => {
            const checkForUpdate = async () => {
              if (!customerId) {
                console.error("Customer OTA ID is not set in environment variables (REACT_APP_OTA_CUSTOMER_ID).");
                return; // Customer ID nahi hai toh kuch na karein
              }

              try {
                // OTA Backend URL ko bhi environment variable se lena behtar hai
                const otaBackendUrl = process.env.REACT_APP_OTA_BACKEND_URL || 'https://crm-based-cms-backend.onrender.com'; // Fallback agar env var set na ho

                const res = await fetch(`${otaBackendUrl}/api/ota/check-update-status?customerId=${customerId}`);

                if (!res.ok) {
                  // CORS error yahan bhi aa sakta hai agar backend config sahi nahi hai
                  console.error(`API error checking update status: ${res.status} ${res.statusText}`);
                  // Agar response body mein error detail hai toh use log karein
                  try {
                    const errorData = await res.json();
                    console.error("Error details:", errorData);
                  } catch (e) {
                    // Ignore if response is not JSON
                  }
                  return;
                }

                const data = await res.json();
                if (data.updateAvailable) {
                  setShowPopup(true);
                  setUpdateType(data.updateType);
                }
              } catch (err) {
                // Network error (jaise CORS block) yahan catch hoga
                console.error("Failed to check for updates (Network/CORS issue?):", err);
                setMessage("❌ Could not check for updates. Please check console for errors."); // User ko feedback dein
              }
            };

            checkForUpdate();
          }, [customerId]); // customerId par nirbharata

          const handleUpdateNow = async () => {
            if (!customerId || !updateType) return; // ID ya type na ho toh update na karein

            setLoading(true);
            setMessage(""); // Purana message clear karein
            try {
              const otaBackendUrl = process.env.REACT_APP_OTA_BACKEND_URL || 'https://crm-based-cms-backend.onrender.com';

              const res = await fetch(
                `${otaBackendUrl}/api/ota/push-update`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ customerId, updateType }),
                }
              );

              const data = await res.json();
              if (res.ok && data.success) { // Check for success flag from backend
                setMessage("✅ Update process initiated successfully. Deployment might take a few minutes.");
                setShowPopup(false); // Popup band karein
                // Optional: Kuch der baad page refresh karne ka prompt de sakte hain
              } else {
                setMessage(`❌ Error: ${data.error || data.message || "Update failed. Check console."}`);
                console.error("Update push failed:", data);
              }
            } catch (err) {
              setMessage("❌ Network error occurred during update push.");
              console.error("Network error during update push:", err);
            } finally {
              setLoading(false);
            }
          };

          if (!showPopup) return null;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md text-center">
                <h2 className="text-xl font-semibold mb-3">New Update Available!</h2>
                <p className="mb-4 capitalize">A new update for the '{updateType}' is ready.</p>
                <button
                  onClick={handleUpdateNow}
                  disabled={loading}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? "Updating..." : "Update Now"}
                </button>
                {message && <p className={`mt-3 text-sm ${message.startsWith('❌') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
                 <button
                    onClick={() => setShowPopup(false)}
                    disabled={loading}
                    className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                 >
                   Maybe Later
                 </button>
              </div>
            </div>
          );
        };

        export default UpdatePopup;

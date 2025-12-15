document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Participants section (render list with delete icon for each participant)
        // Build participants section using DOM methods to prevent XSS
        let participantsSection;
        if (details.participants.length > 0) {
          participantsSection = document.createElement("div");
          participantsSection.className = "participants-section";

          const strong = document.createElement("strong");
          strong.textContent = "Participants:";
          participantsSection.appendChild(strong);

          const ul = document.createElement("ul");
          ul.className = "participants-list";

          details.participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            // Email text
            const emailSpan = document.createElement("span");
            emailSpan.textContent = email;
            li.appendChild(emailSpan);

            li.appendChild(document.createTextNode(" "));

            // Remove button
            const removeBtn = document.createElement("button");
            removeBtn.className = "remove-participant";
            removeBtn.setAttribute("data-activity", encodeURIComponent(name));
            removeBtn.setAttribute("data-email", encodeURIComponent(email));
            removeBtn.setAttribute("aria-label", `Remove ${email}`);
            removeBtn.textContent = "✖";
            li.appendChild(removeBtn);

            ul.appendChild(li);
          });

          participantsSection.appendChild(ul);
        } else {
          participantsSection = document.createElement("div");
          participantsSection.className = "participants-section no-participants";
          const em = document.createElement("em");
          em.textContent = "No participants yet.";
          participantsSection.appendChild(em);
        }

        // Set activity card content (excluding participants section)
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Attach event listeners for remove buttons
        activityCard.querySelectorAll(".remove-participant").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const activityName = decodeURIComponent(btn.dataset.activity);
            const email = decodeURIComponent(btn.dataset.email);

            try {
              const resp = await fetch(
                `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(
                  email
                )}`,
                { method: "DELETE" }
              );

              if (resp.ok) {
                // Refresh activities to update UI
                fetchActivities();
              } else {
                const err = await resp.json();
                console.error("Failed to remove participant:", err);
                alert(err.detail || "Failed to remove participant");
              }
            } catch (err) {
              console.error("Error removing participant:", err);
              alert("Error removing participant. Please try again.");
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();


      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to update UI after signup
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

document.addEventListener("DOMContentLoaded", () => {

  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const activitySearch = document.getElementById("activity-search");
  const activitySort = document.getElementById("activity-sort");
  let allActivities = {};

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      renderActivities();
      populateActivitySelect();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function renderActivities() {
    // Get filter and sort values
    const searchValue = activitySearch ? activitySearch.value.toLowerCase() : "";
    const sortValue = activitySort ? activitySort.value : "name";

    // Convert activities to array for filtering/sorting
    let filtered = Object.entries(allActivities);

    // Filter by search
    if (searchValue) {
      filtered = filtered.filter(([name, details]) =>
        name.toLowerCase().includes(searchValue) ||
        (details.description && details.description.toLowerCase().includes(searchValue))
      );
    }

    // Sort
    if (sortValue === "name") {
      filtered.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortValue === "availability") {
      filtered.sort((a, b) => {
        const aSpots = a[1].max_participants - a[1].participants.length;
        const bSpots = b[1].max_participants - b[1].participants.length;
        return bSpots - aSpots;
      });
    }

    // Render
    activitiesList.innerHTML = "";
    filtered.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      const spotsLeft = details.max_participants - details.participants.length;

      const title = document.createElement("h4");
      title.textContent = name;

      const description = document.createElement("p");
      description.textContent = details.description;

      const schedule = document.createElement("p");
      const scheduleLabel = document.createElement("strong");
      scheduleLabel.textContent = "Schedule: ";
      schedule.appendChild(scheduleLabel);
      schedule.appendChild(document.createTextNode(details.schedule));

      const availability = document.createElement("p");
      const availabilityLabel = document.createElement("strong");
      availabilityLabel.textContent = "Availability: ";
      availability.appendChild(availabilityLabel);
      availability.appendChild(document.createTextNode(`${spotsLeft} spots left`));

      const participantsContainer = document.createElement("div");
      participantsContainer.className = "participants-container";

      if (details.participants.length > 0) {
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = "Participants:";
        participantsSection.appendChild(participantsTitle);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        details.participants.forEach((email) => {
          const li = document.createElement("li");

          const emailSpan = document.createElement("span");
          emailSpan.className = "participant-email";
          emailSpan.textContent = email;

          const deleteBtn = document.createElement("button");
          deleteBtn.type = "button";
          deleteBtn.className = "delete-btn";
          deleteBtn.dataset.activity = name;
          deleteBtn.dataset.email = email;
          deleteBtn.setAttribute("aria-label", `Unregister ${email} from ${name}`);
          deleteBtn.textContent = "❌";
          deleteBtn.addEventListener("click", handleUnregister);

          li.appendChild(emailSpan);
          li.appendChild(deleteBtn);
          participantsList.appendChild(li);
        });

        participantsSection.appendChild(participantsList);
        participantsContainer.appendChild(participantsSection);
      } else {
        const noParticipants = document.createElement("p");
        const em = document.createElement("em");
        em.textContent = "No participants yet";
        noParticipants.appendChild(em);
        participantsContainer.appendChild(noParticipants);
      }

      activityCard.appendChild(title);
      activityCard.appendChild(description);
      activityCard.appendChild(schedule);
      activityCard.appendChild(availability);
      activityCard.appendChild(participantsContainer);
      activitiesList.appendChild(activityCard);
    });
  }

  function populateActivitySelect() {
    // Clear and repopulate the select dropdown
    if (!activitySelect) return;
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    Object.keys(allActivities).forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
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
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
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

  // Add filter event listeners
  if (activitySearch) activitySearch.addEventListener("input", renderActivities);
  if (activitySort) activitySort.addEventListener("change", renderActivities);

  // Initialize app
  fetchActivities();
});

document.addEventListener('DOMContentLoaded', function () {
    const setTimeLimitButton = document.getElementById('setTimeLimitButton');

    setTimeLimitButton.addEventListener('click', function () {
        const timeLimit = prompt("Enter the time limit (in minutes):");
        if (timeLimit !== null && !isNaN(timeLimit) && timeLimit > 0) {
            const timeLimitMs = parseInt(timeLimit) * 60 * 1000; // Convert minutes to milliseconds
            chrome.storage.local.set({ timeLimit: timeLimitMs });
            alert('Time limit set successfully!');
            // Send a message to the background script to handle tab closure after the time limit
            chrome.runtime.sendMessage({ action: 'setTimeLimit', timeLimit: timeLimitMs });
        } else {
            alert('Please enter a valid time limit (in minutes).');
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const addSiteButton = document.getElementById('addSiteButton');
    const newSiteInput = document.getElementById('newSiteInput');
    const errorText = document.getElementById('errorText');
    const restrictedSitesList = document.getElementById('restrictedSitesList');

    addSiteButton.addEventListener('click', function () {
        const siteUrl = newSiteInput.value.trim();
        if (isValidUrl(siteUrl)) {
            // Add the site to the list
            const listItem = document.createElement('li');
            listItem.textContent = siteUrl;
            restrictedSitesList.appendChild(listItem);
            // Clear the input field
            newSiteInput.value = '';
            errorText.style.display = 'none';
            // Save the updated list to storage
            chrome.storage.local.get({ restrictedSites: [] }, function (result) {
                const updatedSites = result.restrictedSites.concat(siteUrl);
                chrome.storage.local.set({ restrictedSites: updatedSites });
            });
        } else {
            errorText.style.display = 'block';
        }
    });

    // Function to validate URL
    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize with the title from the preload API
    const title_el = document.getElementById('title');
    title_el.innerText = "Test Calculator App";
    
    // References to DOM elements
    const studentNameInput = document.getElementById('Student_Name');
    const gradeLevelSelect = document.getElementById('Grade_Level');
    const studentIdInput = document.getElementById('Student_ID');
    const notesTextarea = document.getElementById('Notes');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const studentSelector = document.getElementById('studentSelector');
    const profileDetails = document.getElementById('profileDetails');
    
    // Load existing student profiles
    loadStudentProfiles();
    
    // Handle saving a new student profile
    saveProfileBtn.addEventListener('click', async () => {
        // Validate form
        if (!studentNameInput.value.trim()) {
            alert('Please enter a student name.');
            return;
        }
        
        // Create student profile object
        const studentProfile = {
            name: studentNameInput.value.trim(),
            gradeLevel: gradeLevelSelect.value,
            studentId: studentIdInput.value.trim(),
            notes: notesTextarea.value.trim(),
            createdAt: new Date().toISOString(),
            tests: []
        };
        
        // Save the profile
        try {
            console.log("Saving student profile:", studentProfile);
            const result = await window.api.createStudentProfile(studentProfile);
            if (result.success) {
                alert('Student profile saved successfully!');
                // Clear form
                studentNameInput.value = '';
                gradeLevelSelect.value = '';
                studentIdInput.value = '';
                notesTextarea.value = '';
                // Reload the student profiles
                loadStudentProfiles();
            } else {
                alert('Error saving student profile: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving student profile:', error);
            alert('Failed to save student profile: ' + error.message);
        }
    });
    
    // Handle selecting a student profile
    studentSelector.addEventListener('change', async () => {
        const selectedProfile = studentSelector.value;
        
        if (!selectedProfile) {
            profileDetails.innerHTML = '';
            return;
        }
        
        try {
            console.log("Fetching student profile:", selectedProfile);
            const profile = await window.api.getStudentProfile(selectedProfile);
            displayProfileDetails(profile);
        } catch (error) {
            console.error('Error loading student profile:', error);
            profileDetails.innerHTML = '<p>Failed to load student profile: ' + error.message + '</p>';
        }
    });
    
    async function loadStudentProfiles() {
        try {
            console.log("Requesting student profiles from main process...");
            const profiles = await window.api.getStudentProfiles();
            console.log("Student profiles received:", profiles);
            
            // Clear existing options except the first one
            while (studentSelector.options.length > 1) {
                studentSelector.remove(1);
            }
            
            // Add each profile as an option
            if (profiles && profiles.length > 0) {
                profiles.forEach(profile => {
                    const option = document.createElement('option');
                    option.value = profile.filename;
                    option.textContent = profile.name;
                    studentSelector.appendChild(option);
                });
            } else {
                profileDetails.innerHTML = '<p>No student profiles found.</p>';
            }
        } catch (error) {
            console.error('Error loading student profiles:', error);
            profileDetails.innerHTML = '<p>Failed to load student profiles: ' + error.message + '</p>';
        }
    }
    
    function displayProfileDetails(profile) {
        let html = `
            <h4>${profile.name}</h4>
            <p><strong>Grade Level:</strong> ${profile.gradeLevel ? profile.gradeLevel + 'th Grade' : 'Not specified'}</p>
            <p><strong>Student ID:</strong> ${profile.studentId || 'Not specified'}</p>
            <p><strong>Created:</strong> ${new Date(profile.createdAt).toLocaleDateString()}</p>
        `;
        
        if (profile.notes) {
            html += `<p><strong>Notes:</strong> ${profile.notes}</p>`;
        }
        
        if (profile.tests && profile.tests.length > 0) {
            html += `
                <h5>Test History</h5>
                <ul>
            `;
            
            profile.tests.forEach(test => {
                html += `<li>${test.name} (${new Date(test.date).toLocaleDateString()})</li>`;
            });
            
            html += `</ul>`;
        } else {
            html += `<p>No test history available.</p>`;
        }
        
        profileDetails.innerHTML = html;
    }
});
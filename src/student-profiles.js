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
        // Clear any previous error messages
        const errorMessageElement = document.getElementById('errorMessage');
        if (errorMessageElement) {
            errorMessageElement.remove();
        }
        
        // Validate form
        if (!studentNameInput.value.trim()) {
            displayErrorMessage('Please enter a student name.');
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
                // Display error message
                displayErrorMessage(result.message);
            }
        } catch (error) {
            console.error('Error saving student profile:', error);
            displayErrorMessage('Failed to save student profile: ' + error.message);
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
            displayProfileDetails(profile, selectedProfile);
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
    
    function displayProfileDetails(profile, profileId) {
        let html = `
            <h4>${profile.name}</h4>
            <p><strong>Grade Level:</strong> ${profile.gradeLevel ? profile.gradeLevel + 'th Grade' : 'Not specified'}</p>
            <p><strong>Student ID:</strong> ${profile.studentId || 'Not specified'}</p>
            <p><strong>Created:</strong> ${new Date(profile.createdAt).toLocaleDateString()}</p>
        `;
        
        if (profile.notes) {
            html += `<p><strong>Notes:</strong> ${profile.notes}</p>`;
        }
        
        // Add delete student button
        html += `
            <div class="profile-actions">
                <button id="deleteStudentBtn" class="delete-button">Delete Student</button>
            </div>
        `;
        
        if (profile.tests && profile.tests.length > 0) {
            html += `
                <h5>Test History</h5>
                <table class="tests-table">
                    <thead>
                        <tr>
                            <th>Test Name</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            profile.tests.forEach((test, index) => {
                html += `
                    <tr>
                        <td>${test.name}</td>
                        <td>${new Date(test.date).toLocaleDateString()}</td>
                        <td>
                            <button class="delete-test-btn" data-student-id="${profileId}" data-test-index="${index}" data-test-name="${test.name}">Delete</button>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
            `;
        } else {
            html += `<p>No test history available.</p>`;
        }
        
        profileDetails.innerHTML = html;
        
        // Add event listener for delete student button
        const deleteStudentBtn = document.getElementById('deleteStudentBtn');
        if (deleteStudentBtn) {
            deleteStudentBtn.addEventListener('click', () => {
                deleteStudent(profileId, profile.name);
            });
        }
        
        // Add event listeners for delete test buttons
        const deleteTestButtons = document.querySelectorAll('.delete-test-btn');
        deleteTestButtons.forEach(button => {
            button.addEventListener('click', () => {
                const studentId = button.getAttribute('data-student-id');
                const testIndex = parseInt(button.getAttribute('data-test-index'), 10);
                const testName = button.getAttribute('data-test-name');
                deleteStudentTest(studentId, testIndex, testName);
            });
        });
    }
    
    // Function to delete a student
    async function deleteStudent(studentId, studentName) {
        if (confirm(`Are you sure you want to delete student "${studentName}"?\nThis will permanently delete all their test data as well.\nThis action cannot be undone.`)) {
            try {
                const result = await window.api.deleteStudentProfile(studentId);
                
                if (result.success) {
                    alert(`Student "${studentName}" deleted successfully.`);
                    // Clear the profile details
                    profileDetails.innerHTML = '';
                    // Reset selector to default
                    studentSelector.selectedIndex = 0;
                    // Reload the student profiles
                    loadStudentProfiles();
                } else {
                    alert(`Error deleting student: ${result.message}`);
                }
            } catch (error) {
                console.error('Error deleting student:', error);
                alert(`Failed to delete student: ${error.message}`);
            }
        }
    }
    
    // Function to delete a student test
    async function deleteStudentTest(studentId, testIndex, testName) {
        if (confirm(`Are you sure you want to delete the test "${testName}" for this student?\nThis action cannot be undone.`)) {
            try {
                const result = await window.api.deleteStudentTest({
                    studentId,
                    testIndex,
                    testName
                });
                
                if (result.success) {
                    alert(`Test "${testName}" deleted successfully.`);
                    // Refresh the profile details
                    const profile = await window.api.getStudentProfile(studentId);
                    displayProfileDetails(profile, studentId);
                } else {
                    alert(`Error deleting test: ${result.message}`);
                }
            } catch (error) {
                console.error('Error deleting test:', error);
                alert(`Failed to delete test: ${error.message}`);
            }
        }
    }
    
    // Helper function to display error messages
    function displayErrorMessage(message) {
        // Remove any existing error message
        const oldErrorMessage = document.getElementById('errorMessage');
        if (oldErrorMessage) {
            oldErrorMessage.remove();
        }
        
        // Create and insert error message element
        const errorElement = document.createElement('div');
        errorElement.id = 'errorMessage';
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        // Insert after the save button
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        saveProfileBtn.insertAdjacentElement('afterend', errorElement);
    }
});
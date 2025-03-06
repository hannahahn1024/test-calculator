const title_el = document.getElementById('title');
title_el.innerText = window.api.title;

// Initialize student selector
const student_select = document.getElementById('student_select');
loadStudentProfiles();

// Load student profiles for the dropdown
async function loadStudentProfiles() {
    try {
        console.log("Requesting student profiles from main process...");
        const profiles = await window.api.getStudentProfiles();
        console.log("Student profiles received:", profiles);
        
        // Clear existing options except the first one
        while (student_select.options.length > 1) {
            student_select.remove(1);
        }
        
        // Add each profile as an option
        if (profiles && profiles.length > 0) {
            profiles.forEach(profile => {
                const option = document.createElement('option');
                option.value = profile.filename;
                option.textContent = profile.name;
                student_select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading student profiles:', error);
    }
}

function checkButton() {
    // Function to get the value of a selected radio button from a given form
    function getSelectedValue(form, questionName) {
        let selectedOption = form.querySelector(`input[name="${questionName}"]:checked`);
        if (selectedOption) {
            if (selectedOption.value === "Other") {
                let otherText = form.querySelector(`#${questionName}-othertext`);
                return otherText && otherText.value ? 
                    `Other: ${otherText.value}` : 
                    "Other (no text provided)";
            } else {
                return selectedOption.value;
            }
        } else {
            return "No selection";
        }
    }

    // Retrieve the values for Reading/Writing questions
    let rwForm = document.getElementById("rw-form");
    let rwResults = [];
    for (let i = 1; i <= 54; i++) { // Adjust the range for the actual number of questions
        rwResults.push(`Question ${i}: ${getSelectedValue(rwForm, `rw${i}`)}`);
    }

    // Retrieve the values for Math questions
    let mathForm = document.getElementById("math-form");
    let mathResults = [];
    for (let i = 1; i <= 54; i++) { // Adjust the range for the actual number of questions
        mathResults.push(`Question ${i}: ${getSelectedValue(mathForm, `m${i}`)}`);
    }

    // Return the results as an object
    return {
        rwResults: rwResults,
        mathResults: mathResults
    };
}

function resetForms() {
    note_title_el.value = "";
    
    const rwForm = document.getElementById("rw-form");
    const rwRadios = rwForm.querySelectorAll('input[type="radio"]');
    rwRadios.forEach(radio => {
        radio.checked = false;
    });

    const mathForm = document.getElementById("math-form");
    const mathRadios = mathForm.querySelectorAll('input[type="radio"]');
    mathRadios.forEach(radio => {
        radio.checked = false;
    });

    const otherInputs = document.querySelectorAll('input[type="text"][id$="othertext"]');
    otherInputs.forEach(input => {
        input.value = '';
        input.disabled = true;
    });
}

// Add functionality to enable/disable text fields based on radio selection
document.addEventListener('DOMContentLoaded', function() {
    // For each math question
    for (let i = 1; i <= 54; i++) {
        const otherRadio = document.getElementById(`m${i}-other`);
        const otherText = document.getElementById(`m${i}-othertext`);
        
        if (otherRadio && otherText) {
            // Initially disable text fields
            otherText.disabled = true;
            
            // Enable text field when "Other" radio is selected
            otherRadio.addEventListener('change', function() {
                if (this.checked) {
                    otherText.disabled = false;
                    otherText.focus();
                }
            });
            
            // Disable text field when any other option is selected
            const otherOptions = document.querySelectorAll(`input[name="m${i}"]:not(#m${i}-other)`);
            otherOptions.forEach(option => {
                option.addEventListener('change', function() {
                    if (this.checked) {
                        otherText.disabled = true;
                    }
                });
            });
        }
    }
});

const note_title_el = document.getElementById("SAT_Test_Name");
const note_submit_el = document.getElementById('noteSubmit');

note_submit_el.addEventListener('click', async () => {
    const title = note_title_el.value;
    const studentId = student_select.value;
    const selectedAnswers = checkButton();

    // Validate inputs
    if (!title) {
        alert('Please enter a test name.');
        return;
    }

    // Format the selected answers into a string
    const rwAnswers = selectedAnswers.rwResults.join("\n");
    const mathAnswers = selectedAnswers.mathResults.join("\n");
    const content = `Reading/Writing Results:\n${rwAnswers}\n\nMath Results:\n${mathAnswers}`;

    // If a student is selected, save to their profile
    if (studentId) {
        try {
            console.log("Saving test to student profile:", studentId);
            const res = await window.api.saveStudentTest(studentId, {
                title,
                content
            });
            
            if (res.success) {
                alert(`Test saved successfully for student!`);
            } else {
                alert(`Error saving test to student profile: ${res.message}`);
            }
        } catch (error) {
            console.error('Error saving test to student:', error);
            alert(`Error saving test to student profile: ${error.message}`);
        }
    } 
    
    // Always save to the tests folder
    try {
        console.log("Saving test to tests folder:", title);
        const res = await window.api.createNote({
            title,
            content
        });

        if (res.success) {
            if (!studentId) {
                alert('Test saved successfully!');
            }
            resetForms();
        } else {
            alert('Error saving test.');
        }
    } catch (error) {
        console.error('Error saving test:', error);
        alert(`Error saving test: ${error.message}`);
    }
});
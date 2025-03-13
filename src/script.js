// Set the application title from the preload API
const title_el = document.getElementById('title');
title_el.innerText = window.api.title;

// Initialize student selector
const student_select = document.getElementById('student_select');
loadStudentProfiles();

// Constants for form elements
const note_title_el = document.getElementById("SAT_Test_Name");
const note_submit_el = document.getElementById('noteSubmit');

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
        } else {
            console.log("No student profiles found.");
        }
    } catch (error) {
        console.error('Error loading student profiles:', error);
        // Show a more friendly error message
        alert('Failed to load student profiles. Please try again later.');
    }
}

// Add event listener for student selection change
student_select.addEventListener('change', () => {
    // Short delay to ensure DOM is ready
    setTimeout(() => {
        if (note_title_el) {
            note_title_el.blur(); // First blur it
            note_title_el.focus(); // Then focus it again to reset state
            // Try to move cursor to end of any existing text
            const len = note_title_el.value.length;
            note_title_el.setSelectionRange(len, len);
        }
    }, 100);
});

// Helper function to check if two mathematical expressions are equivalent
function areMathematicallyEqual(expr1, expr2) {
    // If expressions are exactly the same, they're equal
    if (expr1 === expr2) return true;
    
    // Clean and standardize expressions
    const standardize = (expr) => {
        let standardExpr = expr.trim().toLowerCase();
        
        // Remove any "other: " prefix
        if (standardExpr.startsWith('other:')) {
            standardExpr = standardExpr.substring(6).trim();
        }
        
        return standardExpr;
    };
    
    expr1 = standardize(expr1);
    expr2 = standardize(expr2);
    
    // Try to convert both expressions to numbers for comparison
    try {
        // Handle fractions like "1/4"
        const parseFraction = (expr) => {
            if (expr.includes('/')) {
                const parts = expr.split('/');
                if (parts.length === 2) {
                    const numerator = parseFloat(parts[0].trim());
                    const denominator = parseFloat(parts[1].trim());
                    if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                        return numerator / denominator;
                    }
                }
            }
            return parseFloat(expr);
        };
        
        const num1 = parseFraction(expr1);
        const num2 = parseFraction(expr2);
        
        // Check if both are valid numbers and equal
        if (!isNaN(num1) && !isNaN(num2)) {
            // Use a small epsilon for floating-point comparison
            const epsilon = 0.0000001;
            return Math.abs(num1 - num2) < epsilon;
        }
    } catch (e) {
        console.log("Error comparing numbers:", e);
    }
    
    // Handle special cases like π vs 3.14 or 3.14159
    if ((expr1 === 'pi' || expr1 === 'π') && 
        (expr2.startsWith('3.14') || expr2 === '3.142' || expr2 === '3.1416' || expr2 === '3.14159')) {
        return true;
    }
    if ((expr2 === 'pi' || expr2 === 'π') && 
        (expr1.startsWith('3.14') || expr1 === '3.142' || expr1 === '3.1416' || expr1 === '3.14159')) {
        return true;
    }
    
    // If all checks fail, they're not equal
    return false;
}

// Function to collect all selected answers
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

// Function to reset all form fields
function resetForms() {
    // Clear the test name
    note_title_el.value = "";
    
    // Reset the Reading/Writing form
    const rwForm = document.getElementById("rw-form");
    const rwRadios = rwForm.querySelectorAll('input[type="radio"]');
    rwRadios.forEach(radio => {
        radio.checked = false;
    });

    // Reset the Math form
    const mathForm = document.getElementById("math-form");
    const mathRadios = mathForm.querySelectorAll('input[type="radio"]');
    mathRadios.forEach(radio => {
        radio.checked = false;
    });

    // Reset and disable all "other" text inputs
    const otherInputs = document.querySelectorAll('input[type="text"][id$="othertext"]');
    otherInputs.forEach(input => {
        input.value = '';
        input.disabled = true;
    });
    
    // Force blur and focus on the title input to reset its state
    note_title_el.blur();
    setTimeout(() => {
        note_title_el.focus();
    }, 10);
}

// Initialize the "Other" option text fields for Math questions
document.addEventListener('DOMContentLoaded', function() {
    // For each math question
    for (let i = 1; i <= 54; i++) {
        const otherRadio = document.getElementById(`m${i}-other`);
        const otherText = document.getElementById(`m${i}-othertext`);
        
        if (otherRadio && otherText) {
            // Check initial state on page load
            otherText.disabled = !otherRadio.checked;
            
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
    
    // Set initial focus to the test name input
    if (note_title_el) {
        note_title_el.focus();
    }
});

// Handle form submission
note_submit_el.addEventListener('click', async () => {
    const title = note_title_el.value.trim();
    const studentId = student_select.value;
    const selectedAnswers = checkButton();

    // Validate inputs
    if (!title) {
        alert('Please enter a test name.');
        
        // Explicitly set focus back to the input field after the alert
        setTimeout(() => {
            note_title_el.focus();
        }, 0);
        
        return;
    }
    
    // Check for invalid characters in title
    if (!/^[a-zA-Z0-9\-_. ]+$/.test(title)) {
        alert('Test name can only contain letters, numbers, spaces, and the following characters: - _ .');
        
        setTimeout(() => {
            note_title_el.focus();
        }, 0);
        
        return;
    }

    // Format the selected answers into a string
    const rwAnswers = selectedAnswers.rwResults.join("\n");
    const mathAnswers = selectedAnswers.mathResults.join("\n");
    const content = `Reading/Writing Results:\n${rwAnswers}\n\nMath Results:\n${mathAnswers}`;

    try {
        // If a student is selected, save to their profile ONLY
        if (studentId) {
            console.log("Saving test to student profile:", studentId);
            console.log("Test title:", title);
            console.log("Test path will be: students/" + studentId + "/tests/" + title + ".txt");
            
            const res = await window.api.saveStudentTest(studentId, {
                title,
                content
            });
            
            if (res.success) {
                alert(`Test saved successfully for student!`);
                resetForms();
                return; // Exit early to prevent double-saving
            } else {
                alert(`Error saving test to student profile: ${res.message}`);
                
                // Set focus back to the title field
                setTimeout(() => {
                    note_title_el.focus();
                }, 0);
            }
        } else {
            // Only save to main tests folder if no student is selected
            console.log("Saving test to tests folder:", title);
            const res = await window.api.createNote({
                title,
                content
            });

            if (res.success) {
                alert('Test saved successfully!');
                resetForms();
            } else {
                alert('Error saving test.');
                
                // Set focus back to the title field
                setTimeout(() => {
                    note_title_el.focus();
                }, 0);
            }
        }
    } catch (error) {
        console.error('Error saving test:', error);
        alert(`Error saving test: ${error.message}`);
        
        // Set focus back to the title field even after an error
        setTimeout(() => {
            note_title_el.focus();
        }, 0);
    }
});
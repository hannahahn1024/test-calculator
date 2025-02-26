const title_el = document.getElementById('title');
title_el.innerText = api.title;

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
    const selectedAnswers = checkButton();

    // Format the selected answers into a string
    const rwAnswers = selectedAnswers.rwResults.join("\n");
    const mathAnswers = selectedAnswers.mathResults.join("\n");

    const content = `Reading/Writing Results:\n${rwAnswers}\n\nMath Results:\n${mathAnswers}`;

    const res = await api.createNote({
        title,
        content
    });

    console.log(res);

    resetForms();
});
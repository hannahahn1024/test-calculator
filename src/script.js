const title_el = document.getElementById('title');
title_el.innerText = api.title;

function checkButton() {
    // Function to get the value of a selected radio button from a given form
    function getSelectedValue(form, questionName) {
        let selectedOption = form.querySelector(`input[name="${questionName}"]:checked`);
        if (selectedOption) {
            if (selectedOption.value === "Other") {
                let otherText = form.querySelector(`input[name="${questionName}-other-text"]`);
                return otherText ? otherText.value || "Other (no text provided)" : "Other";
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

    note_title_el.value = "";
});
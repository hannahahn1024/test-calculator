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

    // Retrieve and display the values for Reading/Writing questions
    let rwForm = document.getElementById("rw-form");
    let rwResults = [];
    for (let i = 1; i <= 2; i++) { // Adjust the range for the actual number of questions
        rwResults.push(`Question ${i}: ${getSelectedValue(rwForm, `rw${i}`)}`);
    }

    // Retrieve and display the values for Math questions
    let mathForm = document.getElementById("math-form");
    let mathResults = [];
    for (let i = 1; i <= 2; i++) { // Adjust the range for the actual number of questions
        mathResults.push(`Question ${i}: ${getSelectedValue(mathForm, `m${i}`)}`);
    }

    // Display the results
    console.log("Reading/Writing Results:", rwResults.join("\n"));
    console.log("Math Results:", mathResults.join("\n"));
    alert("Reading/Writing Results:\n" + rwResults.join("\n") + "\n\nMath Results:\n" + mathResults.join("\n"));
}

const note_title_el = document.getElementById("SAT_Test_Name");
const note_content_el = document.getElementById("noteContent");
const note_submit_el = document.getElementById('noteSubmit');

note_submit_el.addEventListener('click', async () => {
    const title = note_title_el.value; 
    const content = note_content_el.value; 

    const res = await api.createNote({
        title,
        content,
        // questionM1,
    })

    console.log(res);

    note_title_el.value = "";
    note_content_el.value = "";
})
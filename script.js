document.addEventListener('DOMContentLoaded', function() {
    const employmentButton = document.getElementById('employment');
    const dropdownContent = document.querySelector('.dropdown-content');
    const electionButton = document.getElementById('elections');

    employmentButton.addEventListener('mouseover', function() {
        dropdownContent.style.display = 'block';
    });

    employmentButton.addEventListener('mouseout', function() {
        dropdownContent.style.display = 'none';
    });

    dropdownContent.addEventListener('mouseover', function() {
        dropdownContent.style.display = 'block';
    });

    dropdownContent.addEventListener('mouseout', function() {
        dropdownContent.style.display = 'none';
    });

    electionButton.addEventListener('click', function() {
        window.location.href = 'Election/index.html';
    });
});
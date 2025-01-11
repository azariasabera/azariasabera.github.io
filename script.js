document.getElementById('commentForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const comment = document.getElementById('comment').value;

    // Validate form fields
    if (name.trim() === '' || email.trim() === '' || comment.trim() === '') {
        alert('Please fill in all fields.');
        return;
    }

    // Simulate form submission
    alert(`Thank you for your comment, ${name}!`);

    // Clear form fields
    document.getElementById('commentForm').reset();
});
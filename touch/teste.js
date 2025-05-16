/* ... other CSS ... */

.radius-section {
    background-color: #f9f9f9; /* Very light background */
    border: 1px solid #eee; /* Very light border */
    border-radius: 5px;
    padding: 15px;
    margin-bottom: 20px;
    text-align: left; /* Align text to the left for better flow */
    display: block; /* Ensure it's a block-level element */
    width: 90%; /* Take up most of the container width */
    margin: 20px auto; /* Center it horizontally with some top/bottom margin */
  }
  
  .radius-section form {
      display: flex; /* Make the form elements align horizontally */
      align-items: center;
      gap: 10px;
      margin-bottom: 10px; /* Add some space below the form */
  }
  
  .radius-section label {
    font-weight: 500;
  }
  
  .radius-section input[type="number"] {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 60px; /* Smaller input width */
  }
  
  .radius-section .radius-btn {
    background-color: #5cb85c; /* Professional green */
    color: #fff;
    padding: 8px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: 400;
    transition: background 0.3s ease;
  }
  
  .radius-section .radius-btn:hover {
    background-color: #4cae4c;
  }
  
  .radius-section p {
    margin-top: 0; /* Adjust paragraph margin */
    font-size: 0.9em;
    color: #777;
  }
  
  .dashboard-section {
    max-width: 1000px;
    margin: 0 auto 20px;
    background-color: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    display: grid; /* Enable CSS Grid for the section */
    grid-template-columns: auto 1fr; /* Two columns: auto width for count, 1fr for the rest */
    grid-gap: 20px; /* Spacing between the columns */
    align-items: start; /* Align items to the start of the grid cell */
  }
  
  /* ... the rest of your CSS ... */
fetch('/set.js')
  .then(response => response.text())
  .then(data => {
    console.log('Received settings data:', data);
    
    // Convert module.exports = { ... } to a usable object
    const set = JSON.parse(data.replace(/module\.exports\s*=\s*/, ''));
    console.log('Parsed settings:', set);

    // Find the container where we’ll show the status
    const container = document.querySelector('.container');
    
    // Create a status block
    const statusSection = document.createElement('div');
    statusSection.innerHTML = `
      <h2>🤖 BOT STATUS</h2>
      <p><strong>BOT NAME:</strong> ${set.botname || 'Unknown'}</p>
      <p><strong>MODE:</strong> ${set.mode || 'PRIVATE'}</p>
      <p><strong>PREFIX:</strong> ${set.prefix || 'None'}</p>
    `;
    
    // Add it to the page
    container.appendChild(statusSection);
  })
  .catch(error => console.error('Error fetching settings:', error));
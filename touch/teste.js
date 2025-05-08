<% if (job.status === 'deleted') { %>
    <form action="/jobs/<%= job.id %>/restore-deleted" method="POST" style="display:inline-block;">
        <button type="submit" class="restore-btn">Restore</button>
    </form>
<% } %>
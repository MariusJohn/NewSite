<td class="job-actions">
  <% if (job.status === 'pending') { %>
    <form action="/jobs/admin/<%= job.id %>/approve" method="POST">
      <button type="submit" class="btn btn-remind">Approve</button>
    </form>
    <form action="/jobs/admin/<%= job.id %>/reject" method="POST">
      <button type="submit" class="btn btn-reject">Reject</button>
    </form>
  <% } else if (job.status === 'approved') { %>
    <span class="btn btn-approved">Approved</span>
  <% } %>

  <form action="/jobs/admin/download/<%= job.id %>" method="GET">
    <button type="submit" class="btn btn-download">📦 Download Images</button>
  </form>
</td>

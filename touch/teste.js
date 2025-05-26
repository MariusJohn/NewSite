<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport" />
    <title>Job Quotes - Admin Dashboard</title>
    <link rel="stylesheet" href="/css/admin-dashboard.css">
    <link rel="stylesheet" href="/css/reset.css">
</head>
<body>
    <div class="admin-dashboard-container">
        <div class="sidebar">
            <a href="/."><img src="/img/logo.png" alt="MC Quote Logo"></a>
            <h2>Admin Panel</h2>
            <ul class="menu">
                <li><a href="/jobs/admin?filter=total">Total Jobs (<%= totalCount %>)</a></li>
                <li><a href="/jobs/admin?filter=live">Live Jobs (<%= liveCount %>)</a></li>
                <li><a href="/jobs/admin?filter=approved">Approved Jobs (<%= approvedCount %>)</a></li>
                <li><a href="/jobs/admin?filter=rejected">Rejected Jobs (<%= rejectedCount %>)</a></li>
                <li><a href="/jobs/admin?filter=archived">Archived Jobs (<%= archivedCount %>)</a></li>
                <li><a href="/jobs/admin?filter=deleted">Deleted Jobs (<%= deletedCount %>)</a></li>
                <li><a href="/jobs/admin/quotes" class="active">Jobs with Quotes</a></li>
                <li><a href="/jobs/admin/bodyshops">Bodyshops</a></li>
            </ul>
        </div>
    
        <div class="main-content">
            <h1>Submitted Jobs with Quotes</h1>
    
            <% if (jobs.length === 0) { %>
                <p>No jobs with quotes available at the moment.</p>
            <% } else { %>
                <table class="quotes-table">
                    <thead>
                        <tr>
                            <th>Job ID</th>
                            <th>Customer Details</th>
                            <th>Bodyshop</th>
                            <th>Quote</th>
                            <th>Notes</th>
                            <th>Quote Date</th>
                            <th>Status</th>
                            <th>Days Pending</th>
                            <th>Quote Status</th>
                            <th>Last Action</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <% jobs.forEach(job => { %>
                            <% if (job.quotes && job.quotes.length === 0) { %> <%-- Changed job.Quotes to job.quotes --%>
                                <tr class="no-quotes">
                                    <td><%= job.id %></td>
                                    <td>
                                        <strong>Name:</strong> <%= job.customerName %><br>
                                        <strong>Email:</strong> <%= job.customerEmail %><br>
                                        <strong>Phone:</strong> <%= job.customerPhone %><br>
                                        <strong>Location:</strong> <%= job.location %>
                                    </td>
                                    <td colspan="8">
                                        <span class="pending-warning">No quotes received yet.</span>
                                        <br>
                                        <strong>Pending for:</strong> <%= job.daysPending %> days
                                    </td>
                                    <td>
                                        <a href="/jobs/<%= job.id %>/remind" class="btn btn-remind">Remind</a>
                                    </td>
                                </tr>
                            <% } else if (job.quotes) { %> <%-- Added check for job.quotes before iterating --%>
                                <% job.quotes.forEach(quote => { %> <%-- Changed job.Quotes to job.quotes --%>
                                    <tr>
                                        <td><%= job.id %></td>
                                        <td>
                                            <strong>Name:</strong> <%= job.customerName %><br>
                                            <strong>Email:</strong> <%= job.customerEmail %><br>
                                            <strong>Phone:</strong> <%= job.customerPhone %><br>
                                            <strong>Location:</strong> <%= job.location %>
                                        </td>
                                        <td>
                                            <%= quote.bodyshop ? quote.bodyshop.name : 'Unknown Bodyshop' %><br> <%-- Changed quote.Bodyshop to quote.bodyshop --%>
                                            <%= quote.bodyshop ? quote.bodyshop.email : 'No Email' %><br> <%-- Changed quote.Bodyshop to quote.bodyshop --%>
                                            <%= quote.bodyshop ? quote.bodyshop.area : 'No Area' %> <%-- Changed quote.Bodyshop to quote.bodyshop --%>
                                        </td>
                                        <td>£<%= quote.price.toFixed(2) %></td>
                                        <td><%= quote.notes || 'No notes provided' %></td>
                                        <td><%= quote.createdAt.toLocaleDateString() %></td>
                                        <td><%= job.status || 'Pending' %></td>
                                        <td><%= job.daysPending || 0 %> days</td>
                                        <td><%= job.quoteStatus || 'no_quotes' %></td>
                                        <td><%= quote.updatedAt ? quote.updatedAt.toLocaleDateString() : 'No Action' %></td>
                                        <td>
                                            <a href="/jobs/<%= job.id %>/details" class="btn btn-view">View</a>
                                            <a href="/jobs/<%= job.id %>/archive" class="btn btn-archive">Archive</a>
                                            <a href="/jobs/<%= job.id %>/remind" class="btn btn-remind">Remind</a>
                                        </td>
                                    </tr>
                                <% }) %>
                            <% } %> <%-- Closing the else if for job.quotes --%>
                        <% }) %>
                    </tbody>
                </table>
            <% } %>
        </div>
    </div>
</body>
</html>
About This Project
Group Member	Wordload
Ng Ka Sing 1155078385	:
List all events in a table, and allow sorting of the table with one of the listed fields
Search for events which contain certain keywords in one field chosen by the user which will result in a table of event results similar to that in the above item
A separate view for one single event, containing the event details and also user comments, where users can add new comments (non-threaded)
Flush data
CRUD event data in the local database
Browser history

Yip Tsz Hong 1155079606	:
A separate view for one single event, containing the event details and also user comments, where users can add new comments (non-threaded)
Add events into a list of favourite events, and see the list in another view (flexible implementation)
See username in the top right of screen, and be able to log out
CRUD user data
Login/Logout as user and Admin
User interface

LEUNG Tsz Hin 1155079351 :
CRUD event data
CRUD user data
Obtain event data from CSV file
Browser history
User interface

HOW-TO
Flush data: get the JSON file from the website. 
First, we get the total number of data in the request. 
Since the number of maximum loaded record is restricted to 100 (dafault 10), 
so we split up the process by (total number of data / 100) to get all data.

Search: retrieve the data from mongodb with search keyword. 
If the serach field is empty, all data will be retrived. 
Otherwise, we will use regex to find all matched keywords in the database.

Password: we use SHA-256 library to hash the password string, 
so that this hashed string will be stored in mongodb. 
In additoin, everytime the user enter the password, 
we convert it to hash string to authorize.

Design Data Schemas and Models
var EventSchema = mongoose.Schema({
	eventId: { type: Number, required: true, unique: true },
	activityName: { type: String, required: true },
	dateTime: { type: String, required: true },
	organizationName: { type: String, required: true },
	locationName: { type: String, required: true },
	departmentName: { type: String, required: true },
	enquiryContact: { type: String, required: true }
});
var Event = mongoose.model('Event', EventSchema);

var UserSchema = mongoose.Schema({
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	favourite: { type: String, required: true }
});
var User = mongoose.model('User', UserSchema);


Description of the steps to execute/access your app.
Not Logined User:
1. Log in as user with username and password
  You can login by inputing the input field on the top bar
  If you don't have an account, you can create one.
2. Log in as admin via a link (yes that’s very insecure)
  You can press the button on the top bar (Login as Admin)

Admin:
1. Flush data, i.e. reload from the online dataset
  Find the collapse tab in the html, click on it,
  Admin will find a button on the center.
2. CRUD event data in the local database
  Create new event on a single tab, you can input the field to create one.
  Admin can view the table below.
  Admin can update the event, by clicking on the activity name,
  a modal will pop out. Admin can change the content of activity.
  Admin can delete the evetn, by clicking on the activity name,
  a modal will pop out. Admin can delete the activity by clicking 'delete' button.
3. CRUD user data (username and password only) in the local database
  Create user, get all user, update user, delete user,
  all in one single collapse tab.
4. Obtain event data from CSV file upload (simple instructions need to be provided for
user for data format)
  Admin can mouseenter the instruction object, a tooltip will pop out,
  Admin can upload a csv file from local.
5. Log out as admin
  Admin can logout on the top bar, by clicking on logout button.


User actions:
1. List all events in a table, and allow sorting of the table with one of the listed fields
  User can view the table below. click on the attribute,
  the table will be sorted by this attribute.
2. Search for events which contain certain keywords in one field chosen by the user
which will result in a table of event results similar to that in the above item
  User can view the table below. By input the field, and select the targeted attribute
  from the option. Then click on 'search' button.
3. A separate view for one single event, containing the event details and also user
comments, where users can add new comments (non-threaded)
  By clicking on the activity name, a modal will pop out. 
  this will show all event detail, user can leave a comment, by reply and submit.
4. Add events into a list of favourite events, and see the list in another view (flexible
implementation)
  On the table below show, on the right-most column, there is a heart,
  if not filled, then this activity is not your favourite.
  if filled, then this activity is your favourite.
  Click on not filled heart to add to favourite list.
5. See username in the top right of screen, and be able to log out
  User can view their name on the top bar in the top right of screen.
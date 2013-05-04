require('odata-server');


//$data.defineData("MyDatabase", function (schemaBuilder) {
//    schemaBuilder.addEntity({ });
//});


$data.Entity.extend("Todo", {
    Id: { type: "id", key: true, computed: true },
    Task: { type: String, required: true, maxLength: 200 },
    DueDate: { type: Date },
    Completed: { type: Boolean },
    Creator: { type: 'User', inverseProperty: 'Todos' }
});

$data.Entity.extend("User", {
    Id: { type: "id", key: true, computed: true },
    Name: {type: String },
    Todos: { type: Array, elementType: Todo, inverseProperty: 'Creator' }
});

$data.EntityContext.extend("TodoDatabase", {
    Todos: { type: $data.EntitySet, elementType: Todo },
    Users: { type: $data.EntitySet, elementType: User}
});

$data.ServiceBase.extend("AAA.AAA", {
    abc: function (a,b) {
        /// <returns type='string' />
    }
});

$data.createODataServer(TodoDatabase, '/todo', 52999, 'localhost');
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({
    assignmentTitle: '',
    subjectName: '',
    className: '',
    sectionName: '',
    dueDate: '',
    marks: '',
    file: null,
    description: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await axios.get(`http://localhost:7000/api/teachers/getTeacherById/66f12d8a8f27884ade9f1349`);
        setTeacher(response.data);

        // Destructure the teacher's first and last name from the response
        const { firstName, lastName } = response.data;

        // Fetch classes using the teacher's full name
        fetchClasses(`${firstName} ${lastName}`);
      } catch (err) {
        console.error('Error fetching teacher data:', err);
      }
    };

    fetchTeacher();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Fetch classes based on teacher's name
  const fetchClasses = async (teacherName) => {
    try {
      const response = await axios.get(`http://localhost:7000/api/timetable/getTeacherClasses/${teacherName}`); // Update API endpoint
      setClasses(response.data); // Assuming response.data is an array of classes
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  useEffect(() => {
    if (form.className) {
      fetchSubjects(form.className);
    }
  }, [form.className]);

  const fetchAssignments = async () => {
    try {
      const response = await axios.get('http://localhost:7000/api/assignments/getAssignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  // Update fetchSubjects to use the new API endpoint
  const fetchSubjects = async (className) => {
    if (!teacher) return; // Return if teacher data isn't available yet
    try {
      const { firstName, lastName } = teacher;
      const response = await axios.get(`http://localhost:7000/api/timetable/getSubjectsByTeacherAndClass/${firstName}%20${lastName}/${className}`);
      console.log(response.data);
      // Check if the response is an array before setting state
      if (Array.isArray(response.data.subjects)) {
        setSubjects(response.data.subjects); // Assuming the API returns the subjects correctly
      } else {
        setSubjects([]); // Reset to an empty array if the response is not an array
        console.error('Expected an array but got:', response.data); // Log the unexpected response
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Check if the selected field is className
    if (name === 'className') {
      const [selectedClassName, selectedSectionName] = value.split('|'); // Split based on a unique separator

      // Update both className and sectionName
      setForm({
        ...form,
        className: selectedClassName,
        sectionName: selectedSectionName || '', // Default to an empty string if undefined
      });
    } else {
      setForm({
        ...form,
        [name]: value,
      });
    }
  };

  const handleFileChange = (e) => {
    setForm({ ...form, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('subjectName', form.subjectName);
    formData.append('className', form.className);
    formData.append('sectionName', form.sectionName);
    formData.append('description', form.description);
    formData.append('marks', form.marks);
    if (form.file) {
      formData.append('file', form.file);
    }

    //setIsLoading(true); // Start loading
    try {
      if (editingId) {
        await axios.put(`http://localhost:7000/api/assignments/updateAssignment/${editingId}`, form);
        alert("Updated Successfully");
      } else {
        await axios.post('http://localhost:7000/api/assignments/createAssignment', form);
        alert("Created Successfully");
      }
      setForm({
        assignmentTitle: '',
        subjectName: '',
        className: '',
        sectionName: '',
        dueDate: '',
        marks: '',
        file: null,
        description: '',
      });
      setEditingId(null);
      fetchAssignments();
    } catch (error) {
      console.error('Error saving assignment:', error);
    }
  };

  const handleEdit = (assignment) => {
    setForm(assignment);
    setEditingId(assignment._id);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this assignment?");
    if (confirmDelete) {
      try {
        await axios.delete(`http://localhost:7000/api/assignments/deleteAssignment/${id}`);
        fetchAssignments();
      } catch (error) {
        console.error('Error deleting assignment:', error);
      }
    }
  };

  const getFilteredAssignments = () => {
    return assignments.filter(assignment => {
      return (
        (form.className === '' || assignment.className === form.className) &&
        (form.sectionName === '' || assignment.sectionName === form.sectionName) &&
        (form.subjectName === '' || assignment.subjectName === form.subjectName)
      );
    });
  };

  const clearForm = () => {
    setForm({
      assignmentTitle: '',
      subjectName: '',
      className: '',
      sectionName: '',
      dueDate: '',
      marks: '',
      file: null,
      description: '',
    });
    setEditingId(null);
  }

  return (
    <div className="container mx-auto md:p-4">
      <h1 className="text-xl md:text-3xl font-bold text-center md:mb-4">
        <i className="md:hidden text-yellow-400 fas fa-tasks mr-2"></i>
        Assignments
      </h1>
      <form onSubmit={handleSubmit} className="bg-white p-3 md:p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label htmlFor="className" className="block text-sm font-medium text-gray-700">Class</label>
            <select
              id="className"
              name="className"
              value={`${form.className}|${form.sectionName}`}
              onChange={handleInputChange}
              required
              className="mt-1 p-2 border rounded w-full"
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls._id} value={`${cls.className}|${cls.sectionName}`}>
                  {cls.className} ({cls.sectionName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700">Subject</label>
            <select
              id="subjectName"
              name="subjectName"
              value={form.subjectName}
              onChange={handleInputChange}
              required
              className="mt-1 p-2 border rounded w-full"
              disabled={!form.className}
            >
              <option value="">Select Subject</option>
              {subjects.map((subject, index) => (
                <option key={index} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="assignmentTitle" className="block text-sm font-medium text-gray-700">Assignment Title</label>
            <input
              type="text"
              id="assignmentTitle"
              name="assignmentTitle"
              value={form.assignmentTitle}
              onChange={handleInputChange}
              required
              className="mt-1 p-2 border rounded w-full"
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={form.dueDate}
              onChange={handleInputChange}
              required
              className="mt-1 p-2 border rounded w-full"
            />
          </div>

          <div>
            <label htmlFor="marks" className="block text-sm font-medium text-gray-700">Marks</label>
            <input
              type="number"
              id="marks"
              name="marks"
              value={form.marks}
              onChange={handleInputChange}
              required
              className="mt-1 p-2 border rounded w-full"
            />
          </div>

          <div>
            <label htmlFor="marks" className="block text-sm font-medium text-gray-700">Upload Assignment (Optional)</label>
            <input
              type="file"
              id="file"
              name="file"
              onChange={handleFileChange}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleInputChange}
              className="mt-1 p-2 border rounded w-full"
            ></textarea>
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-800 hover:bg-blue-600 text-white p-2 md:px-6 rounded"
        >
          {editingId ? 'Update Assignment' : 'Add Assignment'}
        </button>
        {editingId && (
          <button
            onClick={clearForm}
            className="bg-gray-600 text-white py-2 px-4 ml-4 rounded"
          >
            Cancel
          </button>
        )}
      </form>

      <h2 className="text-lg md:text-xl font-bold mb-4">Assignments List</h2>
      <div className="hidden md:block">
        <table className="min-w-full bg-white border text-center border-gray-300 divide-y divide-gray-200">
          <thead className="bg-gray-200 border-b border-gray-300">
            <tr>
              <th className="px-4 py-2">Sr No.</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Class</th>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Marks</th>
              <th className="px-4 py-2">Due Date</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {form.className && form.subjectName ? (
              getFilteredAssignments().length > 0 ? (
                getFilteredAssignments().map((assignment, index) => (
                  <tr key={assignment._id}>
                    <td className="px-4 py-2 border-b border-gray-300">{index + 1}</td>
                    <td className="px-4 py-2 border-b border-gray-300">{assignment.assignmentTitle}</td>
                    <td className="px-4 py-2 border-b border-gray-300">{assignment.className} ({assignment.sectionName})</td>
                    <td className="px-4 py-2 border-b border-gray-300">{assignment.subjectName}</td>
                    <td className="px-4 py-2 border-b border-gray-300">{assignment.marks}</td>
                    <td className="px-4 py-2 border-b border-gray-300">{new Date(assignment.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2 border-b border-gray-300">
                      <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
                        <button
                          className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-400"
                          onClick={() => handleEdit(assignment)}
                        >
                          <i className="fas fa-edit mr-1"></i>Edit
                        </button>
                        <button
                          className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-500"
                          onClick={() => handleDelete(assignment._id)}
                        >
                          <i className="fas fa-trash mr-1"></i>Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-2 text-center">No assignments found.</td>
                </tr>
              )
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-2 text-center">Please select a class and subject to see the assignments.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="grid grid-cols-1 md:hidden gap-4">
        {form.className && form.subjectName ? (
          getFilteredAssignments().length > 0 ? (
            getFilteredAssignments().map(assignment => (
              <div key={assignment._id} className="border p-4 rounded-md shadow">
                <h3 className="text-lg font-semibold"><i className="fas fa-bookmark text-indigo-500 mr-2"></i>
                  {assignment.assignmentTitle}</h3>
                <p><i className="fas fa-chalkboard-teacher text-teal-500 mr-2"></i>{assignment.className} ({assignment.sectionName})</p>
                <p><i className="fas fa-book text-green-500 mr-2"></i>{assignment.subjectName}</p>
                <p><i className="fas fa-star text-yellow-500 mr-2"></i>Marks : {assignment.marks}</p>
                <p><i className="fas fa-calendar-check text-red-500 mr-2"></i>{new Date(assignment.dueDate).toLocaleDateString()}</p>
                <div className="flex justify-end mt-2 gap-4">
                  <button onClick={() => handleEdit(assignment)} className="text-yellow-500 hover:underline">
                    <i className="fas fa-edit mr-1"></i>Edit
                  </button>
                  <button onClick={() => handleDelete(assignment._id)} className="text-red-500 hover:underline">
                    <i className="fas fa-trash mr-1"></i>Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="border rounded p-4 bg-white shadow text-center">
              <p>No assignments found.</p>
            </div>
          )
        ) : (
          <div className="border rounded p-4 bg-white shadow text-center">
            <p>Please select a class and subject to see the assignments.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Assignments;

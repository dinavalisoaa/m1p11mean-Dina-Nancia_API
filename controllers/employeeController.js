const Employee = require("../models/employee");
const Appointment = require("../models/appointment");
const Utils = require("../utils");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const utilController = require("./utilController");

// Create a new employee
exports.registration = async (req, res) => {
  const employee = req.body;
  try {
    if (
      employee.name == null ||
      employee.firstname == null ||
      employee.dateOfBirth == null ||
      employee.sex == null ||
      employee.address == null ||
      employee.phoneNumber == null ||
      employee.email == null ||
      employee.password == null ||
      employee.confirmationPassword == null
    ) {
      throw new Error("Veuillez remplir les champs obligatoires");
    }
    if (employee.password != employee.confirmationPassword) {
      throw new Error("Mot de passe de confirmation invalide");
    }
    if (!Utils.isValidEmail(employee.email)) {
      throw new Error("Adresse email invalide");
    }
    const newEmployee = new Employee(employee);
    newEmployee.dateOfBirth = new Date(employee.dateOfBirth + "T00:00:00Z");
    newEmployee.schedule.entry = new Date(
      "1970-01-01T" + employee.schedule.entry + ":00Z"
    );
    newEmployee.schedule.exit = new Date(
      "1970-01-01T" + employee.schedule.exit + ":00Z"
    );
    newEmployee.password = Utils.encryptPassword(employee.password);
    newEmployee.profile = null;
    newEmployee.status = 1;
    const savedEmployee = await newEmployee.save();
    res.status(201).json(savedEmployee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all employee
exports.getAllEmployee = async (req, res) => {
  try {
    const employee = await Employee.find().populate("sex");
    res.json(employee);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching employee" });
  }
};

//Get active employee
exports.getActiveEmployee = async (req, res) => {
  try {
    const employee = await Employee.find({ status: { $gt: 0 } }).populate(
      "sex"
    );
    res.json(employee);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching employee" });
  }
};

// Get a specific employee by ID
exports.getEmployee = async (req, res) => {
  const employeeId = req.params.id;
  try {
    const employee = await Employee.findById(employeeId).populate("sex");
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(employee);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching the employee" });
  }
};

exports.authentication = async (req, res) => {
  try {
    const { email, password } = req.body;
    const customer = await Employee.findOne({
      email: email,
      password: Utils.encryptPassword(password),
    });

    if (customer != null) {
      const token = jwt.sign({ userId: customer._id }, "your-secret-key", {
        expiresIn: "1h",
      });

      res.setHeader("Authorization", token);
      console.log({
        token,
        userId: customer._id,
        role: "EMP",
        info: customer,
        expiration:utilController.getExpiration()});
      res
        .status(200)
        .json({
          token,
          userId: customer._id,
          role: "EMP",
          info: customer,
          expiration:utilController.getExpiration()
        });
    } else {
      throw new Error("Compte introuvable");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a employee by ID
exports.updateEmployee = async (req, res) => {
  const employeeId = req.params.id;
  const employee = req.body;
  try {
    console.log(employee.schedule.entry);
    employee.schedule.entry = new Date(
      "1970-01-01T" + employee.schedule.entry + ":00Z"
    );
    employee.schedule.exit = new Date(
      "1970-01-01T" + employee.schedule.exit + ":00Z"
    );
    if (
      employee.schedule.entry == undefined ||
      employee.schedule.exit == undefined
    ) {
      throw new Error("Remplir");
    }

    if (
      employee.profile == undefined ||
      employee.profile == "" ||
      employee.profile == null
    ) {
      employee.profile = null;
    }
    employee.status = 1;
    console.log(employeeId);
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      employee,
      { new: true }
    );
    if (!updatedEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(updatedEmployee);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the employee" });
  }
};

// Delete a employee by ID
// exports.deleteEmployee = async (req, res) => {
//  const serviceId = req.params.id;
//  console.log(serviceId);
//  try {
//    const deletedEmployee = await Employee.findByIdAndDelete(serviceId);
//    if (!deletedEmployee) {
//  return res.status(404).json({ error: 'Employee not found' });
//  }
//    res.json(deletedEmployee);
//  } catch (error) {
//     console.log(error);
//    res.status(500).json({ error: 'An error occurred while deleting the employee' });
//  }
// };

//Activate account
exports.activateAccount = async (req, res) => {
  const employeeId = req.params.id;
  const employee = req.body;
  try {
    const updatedEmployee = await Employee.updateOne(
      { _id: employeeId },
      { $set: { status: 1 } }
    );
    if (!updatedEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(updatedEmployee);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating the employee" });
  }
};

//Deactivate account
exports.deactivateAccount = async (req, res) => {
  const employeeId = req.params.id;
  try {
    const updatedEmployee = await Employee.updateOne(
      { _id: employeeId },
      { $set: { status: 0 } }
    );
    if (!updatedEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(updatedEmployee);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating the employee" });
  }
};

// Montant de commission pour la journee
exports.commissionForTheDay = async (req, res) => {
  const employeeId = req.params.employeeId;
  const date = req.query.date;
  var total = { _id: null, total: 0 };
  try {
    const tasks = await Appointment.aggregate([
      {
        $addFields: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
        },
      },
      {
        $match: {
          status: 2,
          employee: new ObjectId(employeeId),
          year: Number(new Date(date).getFullYear()),
          month: Number(new Date(date).getMonth() + 1),
          day: Number(new Date(date).getDate()),
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "service",
          foreignField: "_id",
          as: "service",
        },
      },
      {
        $addFields: {
          sumCommission: {
            $sum: {
              $map: {
                input: "$service",
                as: "s",
                in: {
                  $divide: [
                    { $multiply: ["$$s.price", "$$s.commission"] },
                    100,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$sumCommission" },
        },
      },
    ]);
    if (tasks.length > 0) {
      total = tasks[0];
    }
    res.json(total);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
};

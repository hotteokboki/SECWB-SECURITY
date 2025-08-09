import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  useTheme,
  Select,
  MenuItem,
} from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Grid,
} from "@mui/material";

const ProgramPage = () => {
  const [programs, setPrograms] = useState([]);
  const [availableLSEEDCoordinators, setAvailableLSEEDCoordinators] = useState(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isSuccessEditPopupOpen, setIsSuccessEditPopupOpen] = useState(false);
  const [showEditButtons, setShowEditButtons] = useState(false);
  const [programFormData, setProgramFormData] = useState({
    name: "",
    description: "",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openAddProgram, setOpenAddProgram] = useState(false);
  const handleOpenAddProgram = () => setOpenAddProgram(true);
  const handleCloseAddProgram = () => setOpenAddProgram(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const programsResponse = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/get-programs`
        );
        if (!programsResponse.ok) throw new Error("Failed to fetch programs");
        const programsData = await programsResponse.json();

        const mappedPrograms = programsData.map((item) => ({
          ...item,
          coordinator_name:
            item.program_coordinator?.trim() || "-- No Coordinator Assigned --",
          program_description: item.description || "—",
          coordinator_email: item.coordinator_email || "—",
          current_coordinator_id: item.coordinator_id, // Keep this to track the currently assigned ID
        }));
        setPrograms(mappedPrograms);

        console.log(mappedPrograms);

        const lseedCoordinatorsResponse = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/get-lseed-coordinators`
        );
        if (!lseedCoordinatorsResponse.ok)
          throw new Error("Failed to fetch LSEED coordinators");
        const lseedCoordinatorsData = await lseedCoordinatorsResponse.json();
        setAvailableLSEEDCoordinators(lseedCoordinatorsData);
      } catch (error) {
        setSnackbarMessage(error.message || "Error fetching data");
        setSnackbarOpen(true);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleEditing = () => {
    setIsEditing(true);
    setShowEditButtons(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleRowUpdate = async (newRow) => {
    const oldRow = programs.find((p) => p.program_id === newRow.id);

    try {
      let coordinatorIdToAssign = null;

      // Determine the user_id based on the selected value
      if (
        newRow.coordinator_name === "-- No Coordinator Assigned --" ||
        newRow.coordinator_name === "-- No Coordinator Assigned --"
      ) {
        coordinatorIdToAssign = null; // Set to null for unassigning
      } else {
        const selectedCoordinator = availableLSEEDCoordinators.find(
          (coord) =>
            `${coord.first_name} ${coord.last_name}` === newRow.coordinator_name
        );
        coordinatorIdToAssign = selectedCoordinator
          ? selectedCoordinator.user_id
          : null;
      }

      const payload = {
        program_id: newRow.id,
        user_id: coordinatorIdToAssign,
      };

      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/assign-program-coordinator`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to update program assignment: ${response.status} ${response.statusText}`
        );
      }

      // Find the actual coordinator object if assigned, to get their email
      const assignedCoordDetails = availableLSEEDCoordinators.find(
        (coord) => coord.user_id === coordinatorIdToAssign
      );

      setPrograms((prevPrograms) =>
        prevPrograms.map((program) =>
          program.program_id === newRow.id
            ? {
                ...program,
                coordinator_name: newRow.coordinator_name,
                coordinator_id: coordinatorIdToAssign,
                coordinator_email: assignedCoordDetails
                  ? assignedCoordDetails.email
                  : "—", // Update email dynamically
              }
            : program
        )
      );

      setSnackbarMessage("Program assignment updated successfully!");
      setSnackbarOpen(true);

      return newRow;
    } catch (error) {
      console.error("Error updating program assignment:", error);
      setSnackbarMessage(error.message || "Error updating program assignment");
      setSnackbarOpen(true);
      return oldRow;
    }
  };

  const handleProgramInputChange = (e) => {
    const { name, value } = e.target;
    setProgramFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddProgram = async () => {
    try {
      // Basic validation
      if (!programFormData.name.trim()) {
        alert("Program name is required");
        return;
      }

      // Send the program data to the backend
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/programs`,
        programFormData
      );

      if (response.status === 201) {
        console.log("Program added successfully:", response.data);
        setIsSuccessPopupOpen(true);
        handleCloseAddProgram(); // Close the dialog
        setProgramFormData({ name: "", description: "" }); // Reset form fields
        setTimeout(() => {
          window.location.reload();
        }, 500); // Adjust delay if needed
      }
    } catch (error) {
      console.error("Failed to add program:", error);
      alert("Failed to add program. Please try again.");
    }
  };

  const columns = [
    {
      field: "coordinator_name",
      headerName: "Program Coordinator",
      flex: 1.5,
      editable: isEditing,
      renderCell: (params) => (
        <Typography
          variant="body2"
          align="center"  // centers text horizontally
          sx={{
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        >
          {params.row.coordinator_name || "-- No Coordinator Assigned --"}
        </Typography>
      ),
      renderEditCell: (params) => (
        <Select
          value={params.value}
          onChange={(e) => {
            params.api.setEditCellValue({
              id: params.id,
              field: params.field,
              value: e.target.value,
            });
          }}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            "& .MuiSelect-select": {
              padding: "8px 14px",
              whiteSpace: "normal",
              wordBreak: "break-word",
              textAlign: "center",  // centers selected text in dropdown
            },
          }}
        >
          <MenuItem value="-- No Coordinator Assigned --" sx={{ color: colors.redAccent[500] }}>
            -- No Coordinator Assigned --
          </MenuItem>

          {availableLSEEDCoordinators.map((user) => (
            <MenuItem
              key={user.user_id}
              value={`${user.first_name} ${user.last_name}`}
            >
              {`${user.first_name} ${user.last_name}`}
            </MenuItem>
          ))}
        </Select>
      ),
    },
    {
      field: "program_name",
      headerName: "Program",
      flex: 1,
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography variant="body2">{params.row.program_name}</Typography>
        </Box>
      ),
    },
    {
      field: "program_description",
      headerName: "Description",
      flex: 2,
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography variant="body2">{params.row.program_description}</Typography>
        </Box>
      ),
    },
    {
      field: "coordinator_email",
      headerName: "Email",
      flex: 2,
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography variant="body2">{params.row.coordinator_email}</Typography>
        </Box>
      ),
    },
  ];

  if (loading) {
    return (
      <Box m="20px">
        <Header title="PROGRAMS PAGE" subtitle="Loading..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m="20px">
        <Header title="PROGRAMS PAGE" subtitle="Error loading data!" />
        <Alert severity="error">{error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header
          title="PROGRAMS PAGE"
          subtitle="View and Manage program assignment"
        />
      </Box>

      <Box display="flex" gap="10px" mt="20px" mb="20px">
        <Button
          variant="contained"
          sx={{ backgroundColor: colors.greenAccent[500], color: "black" }}
          onClick={handleOpenAddProgram}
        >
          Add Program
        </Button>

        <Dialog
          open={openAddProgram}
          onClose={handleCloseAddProgram}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              backgroundColor: "#fff", // White background
              color: "#000", // Black text
              border: "1px solid #000", // Black border for contrast
              borderRadius: "4px", // Rounded corners for the dialog
            },
          }}
        >
          {/* Dialog Title */}
          <DialogTitle
            sx={{
              backgroundColor: "#1E4D2B", // DLSU Green header
              color: "#fff", // White text
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: "bold",
              borderBottom: "1px solid #000", // Separator line below the title
            }}
          >
            Add Program
          </DialogTitle>

          {/* Dialog Content */}
          <DialogContent
            sx={{
              padding: "24px",
              maxHeight: "70vh", // Ensure it doesn't overflow the screen
              overflowY: "auto", // Enable scrolling if content is too long
            }}
          >
            {/* Input Fields */}
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Program Name Field */}
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    marginBottom: "8px", // Space between label and input
                  }}
                >
                  Program Name
                </Typography>

                <TextField
                  name="name"
                  label="Enter Program Name"
                  fullWidth
                  margin="dense"
                  value={programFormData.name}
                  onChange={handleProgramInputChange}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#000", // Consistent border color
                      borderWidth: "1px", // Solid 1px border
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#000", // Darken border on hover
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#000", // Consistent border color when focused
                    },
                    "& .MuiInputBase-input": {
                      color: "#000", // Set text color to black
                    },
                  }}
                />
              </Box>

              {/* Description Field */}
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    marginBottom: "8px", // Space between label and input
                  }}
                >
                  Description
                </Typography>
                <TextField
                  name="description"
                  label="Enter Description"
                  fullWidth
                  margin="dense"
                  multiline
                  value={programFormData.description}
                  onChange={handleProgramInputChange}
                  rows={3}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#000", // Consistent border color
                      borderWidth: "1px", // Solid 1px border
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#000", // Darken border on hover
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#000", // Consistent border color when focused
                    },
                    "& .MuiInputBase-input": {
                      color: "#000", // Set text color to black
                    },
                  }}
                />
              </Box>
            </Box>
          </DialogContent>

          {/* Dialog Actions */}
          <DialogActions
            sx={{
              padding: "16px",
              borderTop: "1px solid #000", // Separator line above the actions
            }}
          >
            {/* Cancel Button */}
            <Button
              onClick={() => {
                handleCloseAddProgram(); // ✅ Closes after timeout
                setTimeout(() => {
                  window.location.reload();
                }, 500); // Adjust delay if needed
              }}
              sx={{
                color: "#000",
                border: "1px solid #000",
                borderRadius: "4px", // Rounded corners
                "&:hover": {
                  backgroundColor: "#f0f0f0", // Hover effect
                },
              }}
            >
              Cancel
            </Button>

            {/* Add Button */}
            <Button
              onClick={handleAddProgram}
              variant="contained"
              disabled={!programFormData.name || !programFormData.description} // 🔥 Disables if name or description is empty
              sx={{
                backgroundColor:
                  programFormData.name && programFormData.description
                    ? "#1E4D2B"
                    : "#A0A0A0", // Gray if disabled
                color: "#fff",
                borderRadius: "4px", // Rounded corners
                "&:hover": {
                  backgroundColor:
                    programFormData.name && programFormData.description
                      ? "#145A32"
                      : "#A0A0A0", // Keep gray on hover when disabled
                },
              }}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={isSuccessPopupOpen} // Controlled by state
          autoHideDuration={3000} // Automatically close after 3 seconds
          onClose={() => setIsSuccessPopupOpen(false)} // Close on click or timeout
          anchorOrigin={{ vertical: "top", horizontal: "center" }} // Position of the popup
        >
          <Alert
            onClose={() => setIsSuccessPopupOpen(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            Program added successfully!
          </Alert>
        </Snackbar>

        <Box display="flex" alignItems="center" gap={2}>
          {!showEditButtons && (
            <Button
              variant="contained"
              sx={{
                backgroundColor: colors.blueAccent[500],
                color: "black",
                "&:hover": {
                  backgroundColor: colors.blueAccent[800],
                },
              }}
              onClick={toggleEditing}
            >
              Enable Editing
            </Button>
          )}
          {/* Cancel and Save Changes Buttons */}
          {showEditButtons && (
            <>
              <Button
                variant="outlined"
                sx={{
                  backgroundColor: colors.redAccent[500],
                  color: "black",
                  "&:hover": {
                    backgroundColor: colors.redAccent[600],
                  },
                }}
                onClick={() => {
                  setIsEditing(false); // Disable editing mode
                  setShowEditButtons(false);
                  setTimeout(() => {
                    window.location.reload();
                  }, 500); // Adjust delay if needed
                }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                sx={{
                  backgroundColor: colors.blueAccent[500],
                  color: "black",
                  "&:hover": {
                    backgroundColor: colors.blueAccent[600],
                  },
                }}
                onClick={() => {
                  setIsEditing(false); // Disable editing mode
                  setShowEditButtons(false);
                  setIsSuccessEditPopupOpen(true);
                  setTimeout(() => {
                    window.location.reload();
                  }, 500); // Adjust delay if needed
                }}
              >
                Save Changes
              </Button>
            </>
          )}
        </Box>
      </Box>
      <Snackbar
        open={isSuccessEditPopupOpen}
        autoHideDuration={3000}
        onClose={() => setIsSuccessEditPopupOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setIsSuccessEditPopupOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Successfully saved!
        </Alert>
      </Snackbar>

      <Box width="100%" backgroundColor={colors.primary[400]} padding="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
          marginBottom="15px"
        >
          Manage Programs
        </Typography>

        <Box
          height="600px"
          minHeight="600px"
          sx={{
            "& .MuiDataGrid-root": { border: "none" },
            "& .MuiDataGrid-cell": { borderBottom: "none" },
            "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
              backgroundColor: colors.blueAccent[700] + " !important",
            },
            "& .MuiDataGrid-virtualScroller": {
              backgroundColor: colors.primary[400],
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "none",
              backgroundColor: colors.blueAccent[700],
              color: colors.grey[100],
            },
          }}
        >
          <DataGrid
            rows={programs.map((item) => ({
              id: item.program_id,
              // Ensure coordinator_id from the backend response is passed to the row data
              // The backend's getProgramCoordinators query aliases u.user_id as coordinator_id
              // So, item.coordinator_id should already be available here.
              coordinator_id: item.coordinator_id,
              coordinator_name: item.coordinator_name,
              program_name: item.program_name || "—",
              program_description: item.program_description || "—",
              coordinator_email: item.coordinator_email,
            }))}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
            getRowId={(row) => row.id}
            getRowHeight={() => 'auto'}
            processRowUpdate={handleRowUpdate}
            onProcessRowUpdateError={(error) => {
              console.error("DataGrid row update error:", error);
              setSnackbarMessage(
                error.message || "Failed to update row in DataGrid."
              );
              setSnackbarOpen(true);
            }}
            sx={{
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center", // vertical centering
                paddingTop: "12px",
                paddingBottom: "12px",
              },
              "& .MuiDataGrid-columnHeader": {
                alignItems: "center", // optional: center header label vertically
              },
              "& .MuiDataGrid-cellContent": {
                whiteSpace: "normal", // allow line wrap
                wordBreak: "break-word",
              },
              "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
              color: `${colors.grey[100]} !important`,
              },
            }}
            slots={{ toolbar: GridToolbar }}
            experimentalFeatures={{ newEditingApi: true }}
            disableSelectionOnClick
          />

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={"success"}
              sx={{ width: "100%" }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Box>
  );
};

export default ProgramPage;

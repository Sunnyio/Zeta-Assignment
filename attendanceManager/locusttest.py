from locust import HttpUser, task, between
import random

class AttendanceUser(HttpUser):
    wait_time = between(1, 3)  # Simulates user think time

    @task(2)
    def add_attendance(self):
        """Simulates adding an attendance record."""
        employee_id = random.randint(1, 100)
        data = {
            "employee_id": employee_id,
            "date": "2025-03-31",
            "status": random.choice(["Present", "Absent", "WFH"]),
            "department": random.choice(["HR", "Engineering", "Sales"])
        }
        self.client.post("/attendance/", json=data)

    @task(1)
    def get_attendance(self):
        """Simulates fetching an employee's attendance records."""
        employee_id = random.randint(1, 100)
        self.client.get(f"/attendance/{employee_id}")

    @task(1)
    def get_attendance_trends(self):
        """Simulates fetching attendance trends."""
        self.client.get("/attendance/trends")

    @task(1)
    def get_insights(self):
        """Simulates making a request to the /insight endpoint."""
        self.client.post("/insight", json={"user_query": "Show me attendance insights"})





# class CustomShape(LoadTestShape):
#     """Load pattern to maintain 10-50 RPS for 1 minute."""
    
#     stages = [
#         {"duration": 60, "users": 50, "spawn_rate": 10},  # Target 50 RPS
#     ]

#     def tick(self):
#         run_time = self.get_run_time()
#         for stage in self.stages:
#             if run_time < stage["duration"]:
#                 return stage["users"], stage["spawn_rate"]
#         return None


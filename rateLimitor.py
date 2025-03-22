from collections import deque
import time


class RateLimiter:
    def __init__(self, max_requests, time_window):
        self.max_requests = max_requests
        self.time_window = time_window
        self.user_request_history = {}
    
    def is_allowed(self, user_id):
        now = time.time()
        
        if user_id not in self.user_request_history:
            self.user_request_history[user_id] = deque()
        
        request_history = self.user_request_history[user_id]
        
        while request_history and now - request_history[0] > self.time_window:
            request_history.popleft()
        
        if len(request_history) < self.max_requests:
            request_history.append(now)
            return True
        else:
            return False

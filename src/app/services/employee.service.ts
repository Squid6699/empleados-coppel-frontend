import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { Employee, EmployeePayload } from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/empleados';
  private readonly requestTimeout = 10000;

  list(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.baseUrl).pipe(timeout(this.requestTimeout));
  }

  create(payload: EmployeePayload): Observable<Employee> {
    return this.http.post<Employee>(this.baseUrl, payload).pipe(timeout(this.requestTimeout));
  }

  update(id: number, payload: EmployeePayload): Observable<Employee> {
    return this.http
      .put<Employee>(`${this.baseUrl}/${id}`, payload)
      .pipe(timeout(this.requestTimeout));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(timeout(this.requestTimeout));
  }
}

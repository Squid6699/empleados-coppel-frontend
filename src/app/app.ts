import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';
import { Employee, EmployeePayload } from './models/employee.model';
import { EmployeeService } from './services/employee.service';

interface EmployeeForm {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  sueldoBaseMensual: number | null;
  fechaIngreso: string;
}

@Component({
  imports: [FormsModule, CurrencyPipe, DatePipe],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  employees: Employee[] = [];
  form: EmployeeForm = this.emptyForm();
  editingId: number | null = null;
  isFormVisible = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.employeeService.list().pipe(
      catchError(() => {
        this.errorMessage = 'No se pudo cargar la información. Verifica que el backend esté disponible.';
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
        this.changeDetector.detectChanges();
      }),
    ).subscribe({
      next: (employees) => {
        this.employees = employees;
        this.changeDetector.detectChanges();
      },
    });
  }

  startCreating(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.errorMessage = '';
    this.isFormVisible = true;
  }

  startEditing(employee: Employee): void {
    this.editingId = employee.id;
    this.form = {
      nombre: employee.nombre,
      apellidoPaterno: employee.apellido_paterno,
      apellidoMaterno: employee.apellido_materno ?? '',
      sueldoBaseMensual: employee.sueldo_base_mensual,
      fechaIngreso: employee.fecha_ingreso,
    };
    this.errorMessage = '';
    this.isFormVisible = true;
  }

  closeForm(): void {
    if (!this.isSaving) this.isFormVisible = false;
  }

  save(): void {
    this.isSaving = true;
    this.errorMessage = '';
    const payload: EmployeePayload = {
      nombre: this.form.nombre,
      apellido_paterno: this.form.apellidoPaterno,
      apellido_materno: this.form.apellidoMaterno || null,
      sueldo_base_mensual: this.form.sueldoBaseMensual,
      fecha_ingreso: this.form.fechaIngreso,
    };
    const operation = this.editingId !== null
      ? this.employeeService.update(this.editingId, payload)
      : this.employeeService.create(payload);
    operation.subscribe({
      next: () => {
        this.isSaving = false;
        this.isFormVisible = false;
        this.loadEmployees();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'No se pudo guardar el empleado. Revisa los datos e inténtalo de nuevo.';
      },
    });
  }

  remove(employee: Employee): void {
    if (!confirm(`¿Eliminar a ${this.fullName(employee)}?`)) return;
    this.employeeService.remove(employee.id).subscribe({
      next: () => this.loadEmployees(),
      error: () => this.errorMessage = 'No se pudo eliminar el empleado.',
    });
  }

  fullName(employee: Pick<Employee, 'nombre' | 'apellido_paterno' | 'apellido_materno'>): string {
    return [employee.nombre, employee.apellido_paterno, employee.apellido_materno].filter(Boolean).join(' ');
  }

  initials(employee: Employee): string {
    return `${employee.nombre[0] ?? ''}${employee.apellido_paterno[0] ?? ''}`.toUpperCase();
  }

  private emptyForm(): EmployeeForm {
    return { nombre: '', apellidoPaterno: '', apellidoMaterno: '', sueldoBaseMensual: null, fechaIngreso: '' };
  }
}

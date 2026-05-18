import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, UserPlus, Sparkles, Filter, X, Check, Mail, Clock, Shield } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  department: string;
  shiftStartTime: string;
  createdAt: string;
}

export const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state variables
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Form modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [deptInput, setDeptInput] = useState('Information Security');
  const [roleInput, setRoleInput] = useState<'ADMIN' | 'EMPLOYEE'>('EMPLOYEE');
  const [shiftTime, setShiftTime] = useState('09:00');
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // 1. Fetch staff directory from backend APIs
  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (department) queryParams.append('department', department);
      if (roleFilter) queryParams.append('role', roleFilter);

      const response = await axios.get(`/api/admin/employees?${queryParams.toString()}`);
      setEmployees(response.data);
    } catch (error: any) {
      console.error('Failed to load employee list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounced search trigger
    const delayDebounceFn = setTimeout(() => {
      fetchDirectory();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, department, roleFilter]);

  // 2. Onboard Staff submit handler
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!name || !email) {
      setFormError('Please supply both name and email parameters.');
      return;
    }

    setFormLoading(true);
    try {
      await axios.post('/api/admin/employees', {
        name,
        email,
        password: password || undefined, // empty password triggers server fallback Password123
        role: roleInput,
        department: deptInput,
        shiftStartTime: shiftTime
      });

      setFormSuccess('Staff member onboarded successfully!');
      
      // Reset inputs
      setName('');
      setEmail('');
      setPassword('');
      
      // Reload directory and auto-close modal after delay
      fetchDirectory();
      setTimeout(() => {
        setModalOpen(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      console.error('Employee onboarding failed:', err);
      const msg = err.response?.data?.message || 'Onboarding failed. Verify email format or database connections.';
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div className="text-left">
          <h2 className="text-xl font-bold tracking-tight text-foreground font-sans sm:text-2xl">
            Staff Directory & Onboarding
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Administer employee accounts, assign departments, configure shift thresholds, and register staff.
          </p>
        </div>
        <Button 
          onClick={() => setModalOpen(true)} 
          variant="primary" 
          size="sm" 
          leftIcon={<UserPlus className="h-4 w-4" />}
        >
          Onboard Employee
        </Button>
      </div>

      {/* Control Roster */}
      <div className="grid gap-6 md:grid-cols-4 text-left">
        
        {/* Left Search & Filter Console */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Refine directory searches</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Search Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Search Staff</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or email..." 
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>

            {/* Department Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Department</label>
              <select 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
              >
                <option value="">All Departments</option>
                <option value="Information Security">Information Security</option>
                <option value="Operations">Operations</option>
                <option value="HR Tech">HR Tech</option>
                <option value="Engineering">Engineering</option>
              </select>
            </div>

            {/* Role Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Role Group</label>
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
              >
                <option value="">All Roles</option>
                <option value="EMPLOYEE">Employees</option>
                <option value="ADMIN">Administrators</option>
              </select>
            </div>

          </CardContent>
        </Card>

        {/* Right Staff Roster Table */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Active Staff Roster</CardTitle>
            <CardDescription>Comprehensive lookup displaying schedules and departments</CardDescription>
          </CardHeader>
          <CardContent className="p-0 border-t border-border">
            {loading ? (
              <div className="h-[280px] flex items-center justify-center">
                <p className="text-xs text-muted-foreground animate-pulse">Loading directory entries...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="h-[280px] flex flex-col items-center justify-center space-y-2">
                <Search className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs font-bold text-foreground">No matches found</p>
                <p className="text-[10px] text-muted-foreground">Adjust filters or register new staff above.</p>
              </div>
            ) : (
              <>
                {/* Mobile Stacked Card View */}
                <div className="block md:hidden divide-y divide-border/60">
                  {employees.map((emp) => (
                    <div key={emp.id} className="p-4 space-y-2 text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-foreground text-xs">{emp.name}</p>
                          <p className="text-[10px] text-muted-foreground">{emp.email}</p>
                        </div>
                        <Badge variant={emp.role === 'ADMIN' ? 'primary' : 'secondary'} className="text-[8px] py-0 px-1">
                          {emp.role}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-[10px] pt-1">
                        <span className="text-muted-foreground">{emp.department}</span>
                        <span className="font-mono font-bold text-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-primary" />
                          {emp.shiftStartTime}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-background/50 text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                        <th className="px-6 py-3.5">Name</th>
                        <th className="px-6 py-3.5">Corporate Email</th>
                        <th className="px-6 py-3.5">Department</th>
                        <th className="px-6 py-3.5">Shift Threshold</th>
                        <th className="px-6 py-3.5">Role</th>
                        <th className="px-6 py-3.5">Joined Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-6 py-4 font-semibold text-foreground">{emp.name}</td>
                          <td className="px-6 py-4 text-muted-foreground">{emp.email}</td>
                          <td className="px-6 py-4 text-muted-foreground">{emp.department}</td>
                          <td className="px-6 py-4 font-mono font-bold text-foreground">
                            <Clock className="h-3 w-3 inline-block mr-1 text-primary" />
                            {emp.shiftStartTime}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={emp.role === 'ADMIN' ? 'primary' : 'secondary'} className="text-[9px] py-0 px-1.5">
                              {emp.role === 'ADMIN' && <Shield className="h-2.5 w-2.5 mr-1" />}
                              {emp.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {new Date(emp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Onboard Staff Modal Window */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in text-left">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-premium-hover p-1">
            <CardHeader className="flex flex-row items-center justify-between border-b-0 pb-1">
              <div>
                <CardTitle>Onboard Staff Member</CardTitle>
                <CardDescription>Assign schedule values to build employee profile</CardDescription>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <form onSubmit={handleOnboardSubmit}>
              <CardContent className="space-y-4 pt-2">
                
                {/* Form status cards */}
                {formError && (
                  <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-semibold flex items-center space-x-2">
                    <X className="h-4 w-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="p-3 bg-success/10 border border-success/20 text-success rounded-lg text-xs font-semibold flex items-center space-x-2">
                    <Check className="h-4 w-4 flex-shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground uppercase">Employee Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Luke Skywalker" 
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground uppercase">Corporate Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. luke@geoshield.ai" 
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    required
                  />
                </div>

                {/* Password (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground uppercase">Default Password (Optional)</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Defaults to Password123 if blank" 
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Department */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-foreground uppercase">Department</label>
                    <select 
                      value={deptInput}
                      onChange={(e) => setDeptInput(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    >
                      <option value="Information Security">Information Security</option>
                      <option value="Operations">Operations</option>
                      <option value="HR Tech">HR Tech</option>
                      <option value="Engineering">Engineering</option>
                    </select>
                  </div>

                  {/* Role */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-foreground uppercase">System Role</label>
                    <select 
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value as 'ADMIN' | 'EMPLOYEE')}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    >
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>

                {/* Shift start */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground uppercase">Shift Threshold Time (24h format)</label>
                  <input 
                    type="text" 
                    value={shiftTime}
                    onChange={(e) => setShiftTime(e.target.value)}
                    placeholder="e.g. 09:00" 
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    required
                  />
                </div>

              </CardContent>
              <div className="px-6 py-4 border-t border-border flex items-center justify-end space-x-2 bg-background/30 rounded-b-xl">
                <Button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  variant="secondary"
                  size="sm"
                  className="border border-border bg-transparent"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  isLoading={formLoading}
                  variant="primary"
                  size="sm"
                >
                  Complete Registration
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

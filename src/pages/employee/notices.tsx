import { useQuery } from '@tanstack/react-query'
import { useContext } from 'react'
import { FaPen } from 'react-icons/fa6'
import { Link } from 'react-router-dom'

import Table from '../../components/Table'
import { BLANK_ARRAY, ROUTES } from '../../constants/CONSTANTS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { AuthContext } from '../../contexts/auth'
import { ToastContext } from '../../contexts/toast'
import { dayDifference, getEmployeeId, stringToDate } from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import { allEmployees } from 'backend/controllers/employees'

const Notices = () => {
  const { self } = useContext(AuthContext)
  const { onErrorDisplayToast } = useContext(ToastContext)
  const { data: employees = BLANK_ARRAY, isFetching } = useQuery({
    queryKey: ['employeeAssets', ServerSITEMAP.employees.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allEmployees>>(
        ServerSITEMAP.employees.get
      ),
    onError: onErrorDisplayToast
  })
  return (
    <>
      {isFetching && (
        <div className='ms-3 spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      )}
      <Table
        columns={[
          'Employee Id',
          'Name',
          'Company',
          'Department',
          'Date',
          'Days Remaining',
          'Remarks',
          'Action'
        ]}
        rows={employees
          .filter(
            employee =>
              // TODO: active only
              employee.noticePeriod &&
              employee.noticePeriod !== '0NaN-aN-aN' &&
              (self?.type === 'Employee' && self.employeeId
                ? self.employeeId === employee.id
                : true)
          )
          .sort((a, b) => (a.noticePeriod! > b.noticePeriod! ? -1 : 1))
          .map(employee => ({
            ...employee,
            noticePeriodRemaining: employee.noticePeriod
              ? dayDifference(
                  stringToDate(employee.noticePeriod),
                  new Date(),
                  false
                )
              : undefined
          }))
          .filter(
            ({ noticePeriodRemaining }) =>
              typeof noticePeriodRemaining !== 'undefined' &&
              noticePeriodRemaining >= 0
          )
          .map(employee => [
            <>{getEmployeeId(employee)}</>,
            <div className='align-items-center d-flex gap-2 py-2 text-decoration-none'>
              <img
                src='/favicon.png'
                width='50'
                height='50'
                className='object-fit-cover rounded-circle'
              />
              <div>
                <p
                  style={{ fontSize: 12 }}
                  className='fw-lighter m-0 text-info'
                >
                  {employee.email}
                </p>
                <p className='fw-bold m-0 text-nowrap'>{employee.name}</p>
                <p
                  style={{ fontSize: 12 }}
                  className='fw-lighter m-0 text-muted'
                >
                  {employee.designation.name}
                </p>
              </div>
            </div>,
            <>{employee.company.name}</>,
            <>{employee.department.name}</>,
            <>{employee.noticePeriod}</>,
            <>{employee.noticePeriodRemaining} Days</>,
            <>{employee.noticePeriodRemark}</>,
            <Link
              to={
                ROUTES.employee.details.replace(
                  ROUTES.employee._params.id,
                  employee.id.toString()
                ) + '#noticePeriod'
              }
              className='link-primary text-body'
            >
              <FaPen />
            </Link>
          ])}
      />
    </>
  )
}
export default Notices

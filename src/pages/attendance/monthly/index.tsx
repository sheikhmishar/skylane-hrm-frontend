import { useQuery } from '@tanstack/react-query'
import {
  useContext,
  useEffect,
  useMemo,
  useState,
  type ChangeEventHandler
} from 'react'
import { Link } from 'react-router-dom'

import CalenderSlider from '../../../components/CalenderSlider'
import EmployeeName from '../../../components/EmployeeName'
import ProtectedComponent from '../../../components/ProtectedComponent'
import Select from '../../../components/Select'
import Table from '../../../components/Table'
import { BLANK_ARRAY, ROUTES } from '../../../constants/CONSTANTS'
import ServerSITEMAP from '../../../constants/SERVER_SITEMAP'
import { AuthContext } from '../../../contexts/auth'
import { ToastContext } from '../../../contexts/toast'
import generateCalender, {
  dateToString,
  getDateRange,
  getEmployeeId,
  stringToDate
} from '../../../libs'
import modifiedFetch from '../../../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import { allEmployeeAttendances } from 'backend/controllers/attendances'
import { allCompanies } from 'backend/controllers/companies'
import { holidaysByMonth } from 'backend/controllers/holidays'
import { allEmployeeLeaves } from 'backend/controllers/leaves'
import Employee from 'backend/Entities/Employee'

const MonthlyAttendance = () => {
  const { self } = useContext(AuthContext)
  const { onErrorDisplayToast } = useContext(ToastContext)

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)
  const [companyId, setCompanyId] = useState(-1)
  const [currentDate, setCurrentDate] = useState(new Date())

  const [fromDate, toDate] = useMemo(
    () => getDateRange(currentDate),
    [currentDate]
  )
  const [fromDateString, toDateString] = useMemo(
    () => [fromDate, toDate].map(dateToString) as [string, string],
    [fromDate, toDate]
  )

  useEffect(
    () => setCurrentDate(stringToDate(fromDateString)),
    [fromDateString]
  )

  const { data: holidays = BLANK_ARRAY, isFetching: holidaysLoading } =
    useQuery({
      queryKey: [
        'holidays',
        ServerSITEMAP.holidays.getByMonthStart,
        fromDateString
      ],
      queryFn: () =>
        modifiedFetch<GetResponseType<typeof holidaysByMonth>>(
          ServerSITEMAP.holidays.getByMonthStart.replace(
            ServerSITEMAP.holidays._params.monthStart,
            fromDateString
          )
        ),
      onError: onErrorDisplayToast
    })

  const {
    data: employeeAttendances = BLANK_ARRAY,
    isFetching: employeeAttendancesFetching
  } = useQuery({
    queryKey: [
      'employeeAttendances',
      ServerSITEMAP.attendances.get,
      fromDateString,
      toDateString
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allEmployeeAttendances>>(
        ServerSITEMAP.attendances.get +
          '?' +
          new URLSearchParams({
            from: fromDateString,
            to: toDateString
          } satisfies Partial<typeof ServerSITEMAP.attendances._queries>)
      ),
    onError: onErrorDisplayToast
  })

  const { data: employeeLeaves = BLANK_ARRAY, isFetching: fetchingLeaves } =
    useQuery({
      queryKey: [
        'employeeLeaves',
        ServerSITEMAP.leaves.get,
        fromDateString,
        toDateString
      ],
      queryFn: () =>
        modifiedFetch<GetResponseType<typeof allEmployeeLeaves>>(
          ServerSITEMAP.leaves.get +
            '?' +
            new URLSearchParams({
              from: fromDateString,
              to: toDateString
            } satisfies typeof ServerSITEMAP.leaves._queries)
        ),
      onError: onErrorDisplayToast
    })

  const { data: companies = BLANK_ARRAY, isFetching: fetchingCompanies } =
    useQuery({
      queryKey: ['companies', ServerSITEMAP.companies.get],
      queryFn: () =>
        modifiedFetch<GetResponseType<typeof allCompanies>>(
          ServerSITEMAP.companies.get
        ),
      onError: onErrorDisplayToast
    })

  const calender = useMemo(
    () => generateCalender(fromDate, toDate),
    [fromDate, toDate]
  )

  const isFetching =
    employeeAttendancesFetching ||
    fetchingCompanies ||
    holidaysLoading ||
    fetchingLeaves

  return (
    <>
      <div className='align-items-center d-flex flex-wrap gap-2 justify-content-between mb-3'>
        <CalenderSlider
          monthly
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
        />

        <ProtectedComponent rolesAllowed={['SuperAdmin', 'HR']}>
          <div className='col-3'>
            <Select
              id='company'
              label=''
              value={companyId}
              onChange={({ target: { value } }) =>
                setCompanyId(parseInt(value) || -1)
              }
              options={[{ label: 'All', value: -1 }].concat(
                companies.map(company => ({
                  label: company.name,
                  value: company.id
                }))
              )}
            />
          </div>
        </ProtectedComponent>

        <div className='ms-2 w-25'>
          <input
            className='form-control py-2 rounded-3'
            id='search'
            placeholder='Search here'
            onChange={onSearchInputChange}
            value={search}
          />
        </div>

        {isFetching && (
          <div className='ms-3 spinner-border text-primary' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
        )}
        <div className='d-flex flex-column ms-auto py-2'>
          <span className='text-nowrap'>
            <strong className='text-primary'>P</strong> = Present,
          </span>
          <span className='text-nowrap'>
            <strong className='text-danger'>A</strong> = Absent / Leave Without
            Payment,
          </span>
          <span className='text-nowrap'>
            <strong className='text-black-50'>O</strong> = Offday,
          </span>
          <span className='text-nowrap'>
            <strong className='text-black-50'>L</strong> = Paid Leave,
          </span>
          <span className='text-nowrap'>
            <strong className='text-success'>OA</strong> = Offday Attendance
          </span>
        </div>
      </div>

      <Table
        columns={['Employee'].concat(
          calender.map(({ date }) => (date === '01' ? ' |  01' : date))
        )}
        rows={[
          [<></>].concat(
            calender.map(({ date, month }) => (
              <strong className='text-primary'>
                {date.endsWith('22') || date.endsWith('07')
                  ? stringToDate(`2011-${month}-01`)
                      .toDateString()
                      .substring(4, 7)
                  : ''}
                {date.endsWith('01') ? '|' : ''}
              </strong>
            ))
          )
        ]
          .concat([
            [<></>].concat(
              calender.map(({ dayName }) => (
                <span style={{ fontSize: 12 }} className='text-info'>
                  {dayName}
                </span>
              ))
            )
          ])
          .concat(
            employeeAttendances
              .filter(
                employee =>
                  (
                    [
                      'name',
                      'email',
                      'phoneNumber'
                    ] satisfies (keyof Employee)[]
                  ).find(key =>
                    employee[key]
                      .toString()
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  ) || getEmployeeId(employee).includes(search.toLowerCase())
              )
              .filter(({ id, company: { id: cid } }) =>
                self?.type === 'Employee' && self.employeeId
                  ? id === self.employeeId
                  : companyId !== -1
                  ? cid === companyId
                  : true
              )
              .map(employee => {
                const leaves = employeeLeaves.find(
                  ({ id }) => employee.id === id
                )
                return [
                  <Link
                    to={
                      ROUTES.attendance.details.replace(
                        ROUTES.attendance._params.id,
                        employee.id.toString()
                      ) +
                      '?' +
                      new URLSearchParams({
                        month: fromDateString
                      } satisfies typeof ROUTES.attendance._queries)
                    }
                    className='text-decoration-none'
                  >
                    <EmployeeName
                      employee={{
                        id: employee.id,
                        dateOfJoining: employee.dateOfJoining,
                        name: employee.name,
                        designation: employee.designation.name,
                        email: employee.email,
                        photo: employee.photo
                      }}
                    />
                  </Link>
                ].concat(
                  calender.map(({ month, date }) => {
                    const year =
                      month === '01'
                        ? toDate.getFullYear()
                        : fromDate.getFullYear()
                    const dateString = `${month}-${date}`
                    const fullDate = stringToDate(`${year}-${dateString}`)

                    // FIXME; undefined ?
                    return employee.attendances?.find(
                      attendance => attendance.date.substring(5) === dateString
                    ) ? (
                      holidays.find(
                        ({ date: d }) => dateString === d.substring(5)
                      ) ? (
                        <strong className='text-success'>OA</strong>
                      ) : (
                        <strong className='text-primary'>P</strong>
                      )
                    ) : holidays.find(
                        ({ date: d }) => dateString === d.substring(5)
                      ) ? (
                      <strong className='text-black-50'>O</strong>
                    ) : leaves?.leaves.find(
                        // TODO: precompute
                        ({ from, to, type }) =>
                          stringToDate(from) <= fullDate &&
                          stringToDate(to) >= fullDate &&
                          type === 'paid'
                      ) ? (
                      <strong className='text-black-50'>L</strong>
                    ) : (
                      <strong className='text-danger'>A</strong>
                    )
                  })
                )
              })
          )}
      />
    </>
  )
}

export default MonthlyAttendance

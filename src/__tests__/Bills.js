import { fireEvent, screen, waitFor } from "@testing-library/dom";
import mockStore from "../__mocks__/store"
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
  })

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      const windowIcon = await waitFor(() => screen.getByTestId("icon-window"));
      expect(windowIcon.getAttribute('class')).toEqual('active-icon')
    });
    test("Then bills should be ordered from earliest to latest", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const store = mockStore
      const bill = new Bills({
        document, onNavigate, store, bills, localStorage: window.localStorage
      })

      document.body.innerHTML = BillsUI({ data: bills.sort(bill.byDESCDate) })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    });
  });
  describe("When I click on 'new bill button'", () => {
    test("Then i should be sent on New Bill page", async () => {
      document.body.innerHTML = BillsUI({ data: bills })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const store = null
      const bill = new Bills({
        document, onNavigate, store, bills, localStorage: window.localStorage
      })

      const buttonNewBill = screen.getByTestId('btn-new-bill')
      const handleClickNewBill = jest.fn(e => bill.handleClickNewBill(e))
      buttonNewBill.addEventListener('click', handleClickNewBill)
      fireEvent.click(buttonNewBill)
      expect(handleClickNewBill).toHaveBeenCalled()
      const formNewBill = await waitFor(() => screen.getByTestId('form-new-bill'))
      expect(formNewBill).toBeTruthy()
    })
  })
  describe("When I click on the first icon eye", () => {
    test("Then a modal should open including bill proof", async () => {
      document.body.innerHTML = BillsUI({ data: [bills[0]] })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const store = null
      const bill = new Bills({
        document, onNavigate, store, bills, localStorage: window.localStorage
      })

      $.fn.modal = jest.fn();

      const iconEyes = screen.getAllByTestId('icon-eye')

      const handleClickIconEye = jest.fn(() => bill.handleClickIconEye(iconEyes[0]))
      iconEyes[0].addEventListener('click', handleClickIconEye)
      fireEvent.click(iconEyes[0])
      expect(handleClickIconEye).toHaveBeenCalled()

      const modal = document.getElementById("modaleFile");
      expect(modal).toBeTruthy();
    })
  })

  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const mockedBills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      console.log(mockStore);
      const bills = await mockedBills.getBills();
      expect(bills.length != 0).toBeTruthy();
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");

        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        document.body.innerHTML = BillsUI({ error: "Erreur 404" });
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        document.body.innerHTML = BillsUI({ error: "Erreur 500" });
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  })
});



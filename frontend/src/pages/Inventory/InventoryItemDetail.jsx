import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import API from "../../api/api";

const InventoryItemDetail = forwardRef(
  ({ item, onBack, user, blindMode }, ref) => {
    const [count, setCount] = useState(item.currentCount || 0);

    /* -----------------------------------------
     UPDATE COUNT IN DATABASE
  ----------------------------------------- */
    async function updateCount(newCount) {
      setCount(newCount);

      // Your API wrapper uses updateItem(), not updateItemCount()
      await API.updateItem(item._id, { currentCount: newCount });
    }

    /* -----------------------------------------
     ADD BUTTON HANDLER
  ----------------------------------------- */
    function add(type) {
      const amount =
        type === "case"
          ? item.caseSize
          : type === "cambro"
            ? item.cambroSize
            : type === "bag"
              ? item.bagSize
              : 1;

      const newCount = count + amount;
      updateCount(newCount);
    }

    /* -----------------------------------------
     BARCODE SCAN AUTO-INCREMENT
  ----------------------------------------- */
    function addOneUnitFromScan() {
      const newCount = count + 1;
      updateCount(newCount);
    }

    /* Expose addOneUnitFromScan() to parent via ref */
    useImperativeHandle(ref, () => ({
      addOneUnitFromScan,
    }));

    /* Allow scanning inside item detail */
    useEffect(() => {
      function listener(e) {
        if (e.key === "Enter") {
          addOneUnitFromScan();
        }
      }
      window.addEventListener("keydown", listener);
      return () => window.removeEventListener("keydown", listener);
    }, [count]);

    /* -----------------------------------------
     RENDER
  ----------------------------------------- */
    return (
      <div>
        <button onClick={onBack}>Back to Items</button>

        <h2>{item.name}</h2>
        <img src={item.photoUrl} className="item-photo-large" />

        <p>
          <strong>Vendor:</strong> {item.vendor}
        </p>

        {/* BLIND MODE HIDES PAR + LAST COUNT */}
        {!blindMode && (
          <>
            <p>
              <strong>PAR:</strong> {item.par}
            </p>
            <p>
              <strong>Last Count:</strong> {item.lastCount}
            </p>
          </>
        )}

        <p>
          <strong>Current Count:</strong> {count}
        </p>

        <div className="add-buttons">
          <button onClick={() => add("case")}>Add Case</button>
          <button onClick={() => add("cambro")}>Add Cambro</button>
          <button onClick={() => add("bag")}>Add Bag</button>
          <button onClick={() => add("unit")}>Add Unit</button>
        </div>

        <div className="barcode-section">
          <h3>Barcode</h3>
          <img src={item.barcodeImageUrl} className="barcode-img" />
        </div>

        {(user?.role === "district" || user?.role === "corporate") && (
          <div className="admin-controls">
            <button>Edit Item</button>
            <button>Delete Item</button>
          </div>
        )}
      </div>
    );
  },
);

export default InventoryItemDetail;

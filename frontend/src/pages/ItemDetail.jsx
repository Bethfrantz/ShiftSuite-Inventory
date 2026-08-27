import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import "./ItemDetail.css";

export default function ItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);

  async function loadItem() {
    const data = await API.getItem(itemId);
    setItem(data);
  }

  useEffect(() => {
    loadItem();
  }, [itemId]);

  if (!item) return <div>Loading...</div>;

  return (
    <div className="item-detail-page">
      <button className="back-button" onClick={() => navigate("/items")}>
        ← Back to Items
      </button>

      <div className="item-detail-card">
        <div className="item-detail-left">
          {item.photoUrl ? (
            <img
              src={item.photoUrl}
              alt={item.name}
              className="item-detail-photo"
            />
          ) : (
            <div className="item-detail-photo placeholder">No Photo</div>
          )}

          {item.categoryPhotoUrl ? (
            <img
              src={item.categoryPhotoUrl}
              alt="Category"
              className="item-detail-category-photo"
            />
          ) : (
            <div className="item-detail-category-photo placeholder">
              No Category Photo
            </div>
          )}
        </div>

        <div className="item-detail-right">
          <h1>{item.name}</h1>
          <p>
            <strong>Vendor:</strong> {item.vendor}
          </p>
          <p>
            <strong>Barcode:</strong> {item.barcode || "None"}
          </p>
          <p>
            <strong>Units:</strong> {item.units}
          </p>
          <p>
            <strong>Par:</strong> {item.par}
          </p>
          <p>
            <strong>Description:</strong> {item.description || "No description"}
          </p>

          <div className="item-detail-actions">
            <button
              className="edit-button"
              onClick={() => navigate(`/items/edit/${item.itemId}`)}
            >
              Edit Item
            </button>

            <button
              className="delete-button"
              onClick={() => navigate(`/items/delete/${item.itemId}`)}
            >
              Delete Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
